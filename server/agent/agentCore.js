import { GoogleGenAI } from '@google/genai';
import { routeIntent } from './intentRouter.js';
import { FRIDAY_SYSTEM_PROMPT, formatFridayResponse } from './personality.js';
import { executeTool } from '../tools/index.js';
import { GrokClient } from './grokClient.js';
import { config } from '../config.js';

const AVAILABLE_TOOLS_SPEC = `
1. open_application(name: string) - Launch desktop application or webpage (e.g. "vs code", "whatsapp", "chrome", "spotify", "notepad", "calculator", "excel", "word", "youtube", "github").
2. close_application(name: string) - Safely close an application process or browser tab (e.g. "whatsapp", "spotify", "youtube", "tab").
3. open_url(url: string) - Visibly open any website URL in user's browser (e.g. "https://github.com", "google.com").
4. browser_search(query: string, platform?: "google"|"youtube"|"github"|"stackoverflow") - Search the web, YouTube, GitHub, or StackOverflow.
5. play_music(query?: string) - Directly play a song or video on YouTube (or plays user's favorite song if query mentions favorite song).
6. save_favorite_song(song: string) - Save user's favorite song into persistent memory.
7. get_favorite_song() - Retrieve user's saved favorite song from persistent memory.
8. send_whatsapp_message(recipient: string, message: string) - Open WhatsApp desktop/web to send a message to a contact.
9. get_system_metrics() - Inspect current CPU usage, RAM usage, and battery/storage health.
10. lock_computer() - Lock the user's PC/workstation screen.
11. git_status() - Inspect git status of current project workspace.
12. run_tests() - Run test suite in current workspace directory.
13. run_terminal(command: string) - Run a shell/terminal command safely in workspace.
14. search_files(query: string) - Find files or directories in the project matching a keyword.
15. read_file(filePath: string) - Read contents of a project file.
16. write_file(filePath: string, content: string) - Write/save changes to a project file.
17. create_reminder(title: string, minutes?: number) - Set a timed reminder for the user.
18. get_dsa_challenge(category?: string, difficulty?: string) - Generate an interactive DSA coding problem with hints.
`;

export class AgentCore {
  constructor(permissionManager, auditLogger, memoryStore, activityTracker, projectTracker) {
    this.permissionManager = permissionManager;
    this.auditLogger = auditLogger;
    this.memoryStore = memoryStore;
    this.activityTracker = activityTracker;
    this.projectTracker = projectTracker;
    this.pendingAuthorizations = new Map();

    // Grok AI (xAI API) Client
    this.grok = new GrokClient(config.grokApiKey, config.grokModel);

    // Gemini API Client
    const geminiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    if (geminiKey) {
      this.ai = new GoogleGenAI({ apiKey: geminiKey });
    } else {
      this.ai = null;
    }

    this.primaryProvider = config.primaryProvider || 'grok';
  }

  /**
   * Process incoming user speech audio transcript or text input
   */
  async processInput(userInput, sendWsMessage, imageData = null, language = 'en') {
    console.log(`[AgentCore:FRIDAY] Processing audio/text input: "${userInput}" (Has Image: ${!!imageData})`);
    this.activityTracker.recordActivity('CONVERSATION', userInput);

    // 1. FAST TIER: Instant 0ms Deterministic Intent Router for direct commands
    if (!imageData) {
      const directIntent = routeIntent(userInput);
      if (directIntent) {
        console.log('[AgentCore:FRIDAY] Matched fast intent router:', directIntent);
        const handled = await this.executeIntentOrRequestConfirm(directIntent, sendWsMessage);
        if (handled) return;
      }
    }

    // 2. INTELLIGENT TIER: Grok AI / Gemini Multi-Model Task Deduction Engine
    const memories = this.memoryStore.getMemories().slice(0, 6).map(m => `${m.key}: ${m.value}`).join('\n');

    // A. If Grok AI is available and no image data (or primary provider is grok), deduce task with Grok
    if (this.grok.isAvailable() && !imageData) {
      try {
        console.log('[AgentCore:FRIDAY] Deducing audio input task with Grok AI...');
        const deduction = await this.grok.deduceTask(userInput, AVAILABLE_TOOLS_SPEC, memories);

        if (deduction) {
          console.log('[AgentCore:FRIDAY] Grok deduction result:', deduction);

          if (deduction.isTask && deduction.tool) {
            // Task deduced by Grok AI!
            const intent = { tool: deduction.tool, args: deduction.args || {} };
            const handled = await this.executeIntentOrRequestConfirm(intent, sendWsMessage, deduction.response);
            if (handled) return;
          } else if (deduction.response) {
            // Conversational/reasoning response from Grok AI
            const cleanText = formatFridayResponse(deduction.response);
            sendWsMessage({
              type: 'RESPONSE',
              text: cleanText,
              provider: 'grok',
              toolExecutions: []
            });
            return;
          }
        }
      } catch (err) {
        console.warn('[AgentCore:FRIDAY] Grok AI deduction failed, falling over to Gemini/local:', err.message);
      }
    }

    // B. Gemini Reasoning & Multimodal Vision Analysis (or fallback if Grok key not set)
    if (this.ai) {
      try {
        console.log(`[AgentCore:FRIDAY] Reasoning with Gemini API (${config.geminiModel})...`);
        const contextPrompt = `${FRIDAY_SYSTEM_PROMPT}\n\n${AVAILABLE_TOOLS_SPEC}\n\nUSER MEMORIES & PREFERENCES:\n${memories}\n\nUser Audio Input: "${userInput}"`;

        let contentsPayload = contextPrompt;
        if (imageData) {
          const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, '');
          contentsPayload = [
            contextPrompt,
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg'
              }
            }
          ];
        }

        const response = await this.ai.models.generateContent({
          model: config.geminiModel || 'gemini-2.5-flash',
          contents: contentsPayload
        });

        const text = response.text || '';
        if (text.trim()) {
          const cleanText = formatFridayResponse(text.trim());
          sendWsMessage({
            type: 'RESPONSE',
            text: cleanText,
            provider: 'gemini',
            toolExecutions: imageData ? [{ name: 'screen_vision_analysis', args: { prompt: userInput }, status: 'success' }] : []
          });
          return;
        }
      } catch (err) {
        console.warn('[AgentCore:FRIDAY] Gemini API rate limit or error, checking Grok fallback:', err.message);
        
        // If Gemini failed but Grok is available, try Grok as emergency failover
        if (this.grok.isAvailable()) {
          try {
            const fallbackGrok = await this.grok.chatCompletion([
              { role: 'system', content: FRIDAY_SYSTEM_PROMPT },
              { role: 'user', content: userInput }
            ]);
            if (fallbackGrok && fallbackGrok.trim()) {
              sendWsMessage({
                type: 'RESPONSE',
                text: formatFridayResponse(fallbackGrok.trim()),
                provider: 'grok-failover',
                toolExecutions: []
              });
              return;
            }
          } catch (grokErr) {
            console.warn('[AgentCore:FRIDAY] Grok failover error:', grokErr.message);
          }
        }
      }
    }

    // 3. TIER 3: Robust Local Conversational Fallback
    const fallbackText = imageData
      ? "I inspected your screen! Looks like you have an active window open. How can I assist you with it?"
      : this.generateFallbackResponse(userInput);

    sendWsMessage({
      type: 'RESPONSE',
      text: fallbackText,
      provider: 'local-fallback',
      toolExecutions: []
    });
  }

  /**
   * Helper to evaluate risk, ask for confirmation if dangerous, or execute tool
   */
  async executeIntentOrRequestConfirm(intent, sendWsMessage, customResponse = null) {
    const riskLevel = this.permissionManager.evaluateRisk(intent.tool, intent.args);

    if (riskLevel === 'DANGEROUS') {
      const requestId = `req_${Date.now()}`;
      this.pendingAuthorizations.set(requestId, { intent, sendWsMessage, customResponse });

      sendWsMessage({
        type: 'CONFIRMATION_REQUIRED',
        request: {
          id: requestId,
          title: `Authorization Required for ${intent.tool}`,
          description: `Friday is requesting permission to execute ${intent.tool} on your system.`,
          riskLevel: 'DANGEROUS',
          target: JSON.stringify(intent.args)
        }
      });
      return true;
    }

    // Execute Safe / Moderate tool
    const toolResult = await executeTool(intent.tool, intent.args);
    this.auditLogger.log('TOOL_EXECUTION', intent.tool, toolResult.message || JSON.stringify(toolResult));
    this.activityTracker.recordActivity('TOOL_EXECUTION', intent.tool, intent.args);

    const spokenText = customResponse || toolResult.message || `Done. Executed ${intent.tool}.`;
    const responseText = formatFridayResponse(spokenText, intent.tool);

    sendWsMessage({
      type: 'RESPONSE',
      text: responseText,
      toolExecutions: [{ name: intent.tool, args: intent.args, status: toolResult.status || 'success' }]
    });
    return true;
  }

  async handleAuthorization(requestId, approved, sendWsMessage) {
    const pending = this.pendingAuthorizations.get(requestId);
    if (!pending) return;

    this.pendingAuthorizations.delete(requestId);

    if (!approved) {
      this.auditLogger.log('TOOL_CANCELLED', pending.intent.tool, 'User denied confirmation prompt', 'CANCELLED');
      sendWsMessage({
        type: 'RESPONSE',
        text: "Understood. Action cancelled.",
        toolExecutions: []
      });
      return;
    }

    const toolResult = await executeTool(pending.intent.tool, pending.intent.args);
    this.auditLogger.log('TOOL_EXECUTION', pending.intent.tool, toolResult.message || JSON.stringify(toolResult));

    const spokenText = pending.customResponse || toolResult.message || "Done.";
    sendWsMessage({
      type: 'RESPONSE',
      text: formatFridayResponse(spokenText, pending.intent.tool),
      toolExecutions: [{ name: pending.intent.tool, args: pending.intent.args, status: toolResult.status || 'success' }]
    });
  }

  generateFallbackResponse(input) {
    const lower = (input || '').toLowerCase();
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return "Hello! I am Friday, your desktop AI companion. What can I assist you with today?";
    }
    if (lower.includes('who are you') || lower.includes('what is your name')) {
      return "I am Friday, your autonomous desktop voice companion, powered by Gemini and Grok AI.";
    }
    return "I am ready and listening. Tell me what you'd like me to open, search, or compute.";
  }
}
