import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config.js';

const execAsync = promisify(exec);

export const terminalTools = {
  /**
   * Run safe terminal command
   */
  async run_terminal({ command, cwd }) {
    const runDir = cwd || config.workspaceRoot || process.cwd();
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: runDir, timeout: 30000 });
      const output = (stdout + '\n' + stderr).trim();
      return {
        status: 'success',
        command,
        output: output.length > 3000 ? output.slice(0, 3000) + '\n...[Truncated]' : output,
        message: `Executed: ${command}`
      };
    } catch (err) {
      return {
        status: 'error',
        command,
        output: err.stdout || err.stderr || err.message,
        message: `Command failed: ${err.message}`
      };
    }
  }
};
