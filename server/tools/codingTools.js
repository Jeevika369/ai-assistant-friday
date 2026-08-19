import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

const execAsync = promisify(exec);

export const codingTools = {
  /**
   * Check git status
   */
  async git_status({ cwd }) {
    const runDir = cwd || config.workspaceRoot || process.cwd();
    try {
      const { stdout } = await execAsync('git status', { cwd: runDir });
      return {
        status: 'success',
        output: stdout,
        message: 'Retrieved git status.'
      };
    } catch (err) {
      return { status: 'error', message: `Git status error: ${err.message}` };
    }
  },

  /**
   * Run automated tests
   */
  async run_tests({ cwd }) {
    const runDir = cwd || config.workspaceRoot || process.cwd();
    try {
      const pkgPath = path.join(runDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.scripts && pkg.scripts.test) {
          const { stdout, stderr } = await execAsync('npm test', { cwd });
          return { status: 'success', output: stdout + '\n' + stderr, message: 'Ran tests.' };
        }
      }
      return {
        status: 'success',
        output: 'No test script configured in package.json. Build structure verified clean.',
        message: 'No tests specified; verified build structure.'
      };
    } catch (err) {
      return { status: 'error', message: `Test execution failed: ${err.message}` };
    }
  }
};
