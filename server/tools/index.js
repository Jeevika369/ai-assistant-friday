import { osTools } from './osTools.js';
import { browserTools } from './browserTools.js';
import { fileTools } from './fileTools.js';
import { terminalTools } from './terminalTools.js';
import { codingTools } from './codingTools.js';
import { dsaTools } from './dsaTools.js';
import { productivityTools } from './productivityTools.js';
import { deviceTools } from './deviceTools.js';

export const allTools = {
  ...osTools,
  ...browserTools,
  ...fileTools,
  ...terminalTools,
  ...codingTools,
  ...dsaTools,
  ...productivityTools,
  ...deviceTools,
};

export async function executeTool(toolName, args = {}) {
  if (allTools[toolName]) {
    try {
      const result = await allTools[toolName](args);
      return result;
    } catch (err) {
      return {
        status: 'error',
        message: `Tool execution failed (${toolName}): ${err.message}`
      };
    }
  }

  return {
    status: 'error',
    message: `Unknown tool requested: ${toolName}`
  };
}
