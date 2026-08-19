import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  name: process.env.ASSISTANT_NAME || process.env.FRIDAY_NAME || 'Friday',
  wakeWord: process.env.WAKE_WORD || 'Hey Friday',
  port: parseInt(process.env.PORT || '3001', 10),
  autoStart: process.env.AUTO_START === 'true',
  voiceEnabled: process.env.VOICE_ENABLED !== 'false',
  proactiveMode: process.env.PROACTIVE_MODE === 'true',
  memoryEnabled: process.env.MEMORY_ENABLED !== 'false',
  screenAnalysis: process.env.SCREEN_ANALYSIS === 'true',
  terminalAccess: process.env.TERMINAL_ACCESS !== 'false',
  browserAccess: process.env.BROWSER_ACCESS !== 'false',
  codeAccess: process.env.CODE_ACCESS !== 'false',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  grokApiKey: process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.XAI_API_KEY || '',
  grokModel: process.env.GROQ_MODEL || process.env.GROK_MODEL || '',
  primaryProvider: process.env.PRIMARY_AI_PROVIDER || 'groq',
  workspaceRoot: path.join(__dirname, '..'),
};
