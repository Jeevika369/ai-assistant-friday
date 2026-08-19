/**
 * GrokClient / GroqClient - Ultra-fast LLM client supporting both Groq Cloud (gsk_...) and xAI Grok (xai-...)
 * Performs lightning-fast natural language audio task deduction, parameter extraction, and conversational reasoning.
 */

export class GrokClient {
  constructor(apiKey, model = '') {
    this.apiKey = (apiKey || '').trim();
    
    // Auto-detect Groq Cloud (gsk_...) vs xAI Grok (xai-...)
    if (this.apiKey.startsWith('gsk_')) {
      this.provider = 'groq';
      this.baseUrl = 'https://api.groq.com/openai/v1';
      this.model = model && !model.includes('grok') ? model : 'llama-3.3-70b-versatile';
    } else {
      this.provider = 'xai-grok';
      this.baseUrl = 'https://api.x.ai/v1';
      this.model = model || 'grok-2-latest';
    }
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  /**
   * Send chat completion request to Groq Cloud / xAI Grok API
   */
  async chatCompletion(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Groq/Grok API key not configured');
    }

    const requestedModel = options.model || this.model;

    const payload = {
      model: requestedModel,
      messages: messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens ?? 800,
      stream: false,
      ...(options.response_format ? { response_format: options.response_format } : {})
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      console.log(`[Grok/Groq Client] Calling ${this.provider} API (${requestedModel})...`);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${this.provider} HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Intelligently deduce user task and tool parameters from natural speech / audio transcript
   */
  async deduceTask(userInput, availableToolsDescription, memoryContext = '') {
    const systemPrompt = `You are FRIDAY's Core Task Deduction Engine.
Analyze the user's spoken audio command and determine if they want to execute an actionable tool/task or if this is a general conversational question.

AVAILABLE TOOLS AND SIGNATURES:
${availableToolsDescription}

${memoryContext ? `USER PREFERENCES & MEMORIES:\n${memoryContext}\n` : ''}

INSTRUCTIONS:
1. If the user input represents an actionable task matching one of the tools, output a JSON object with:
   {
     "isTask": true,
     "tool": "<exact_tool_name>",
     "args": { ...exact arguments required by the tool... },
     "response": "<concise spoken confirmation text by Friday, e.g. 'Opening VS Code for you.', strictly NO emojis and NO markdown>"
   }

2. If the user is having a casual conversation, asking a technical or general question, or no tool fits:
   {
     "isTask": false,
     "tool": null,
     "args": {},
     "response": "<Friday's warm, smart, witty, and concise voice response to the user. Strictly plain text, NO emojis, NO markdown.>"
   }

CRITICAL: Return ONLY valid, parseable JSON with no code blocks, no backticks, and no extra preamble.`;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ];

      const rawResponse = await this.chatCompletion(messages, {
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.warn(`[Grok/Groq Client] Task deduction parsing failed:`, err.message);
      return null;
    }
  }
}
