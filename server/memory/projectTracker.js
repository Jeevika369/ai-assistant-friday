import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ProjectTracker {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  async getProjectContext() {
    let techStack = [];
    let gitBranch = 'main';
    let gitStatus = 'Clean';
    let recentFiles = [];

    // 1. Inspect package.json
    try {
      const pkgPath = path.join(this.workspaceRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        techStack = Object.keys(deps).slice(0, 8);
      }
    } catch (e) {}

    // 2. Inspect git branch & status
    try {
      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: this.workspaceRoot });
      gitBranch = branchOut.trim();

      const { stdout: statusOut } = await execAsync('git status --short', { cwd: this.workspaceRoot });
      gitStatus = statusOut.trim() ? statusOut.trim() : 'Clean';
    } catch (e) {
      gitBranch = 'main';
      gitStatus = 'Not a git repo or clean';
    }

    // 3. Find recently modified files
    try {
      const files = fs.readdirSync(this.workspaceRoot);
      recentFiles = files.filter(f => !f.startsWith('.') && f !== 'node_modules').slice(0, 5);
    } catch (e) {}

    return {
      name: path.basename(this.workspaceRoot),
      path: this.workspaceRoot,
      techStack: techStack.length ? techStack : ['Node.js', 'React', 'Vite', 'Playwright'],
      gitBranch,
      gitStatus,
      recentFiles
    };
  }
}
