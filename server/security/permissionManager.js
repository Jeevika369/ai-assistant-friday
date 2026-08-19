export class PermissionManager {
  constructor() {
    this.permissions = {
      FILES_READ: { id: 'FILES_READ', name: 'File Reading', scope: 'SAFE', granted: true },
      FILES_WRITE: { id: 'FILES_WRITE', name: 'File Editing', scope: 'MODERATE', granted: true },
      TERMINAL_EXECUTE: { id: 'TERMINAL_EXECUTE', name: 'Terminal Execution', scope: 'DANGEROUS', granted: true },
      BROWSER_AUTOMATION: { id: 'BROWSER_AUTOMATION', name: 'Browser Agent', scope: 'SAFE', granted: true },
      SYSTEM_CONTROL: { id: 'SYSTEM_CONTROL', name: 'System Operations', scope: 'MODERATE', granted: true },
      DEVICE_CONTROL: { id: 'DEVICE_CONTROL', name: 'Connected Devices', scope: 'SAFE', granted: true },
      CODE_EXECUTION: { id: 'CODE_EXECUTION', name: 'Code Execution & Tests', scope: 'MODERATE', granted: true },
    };
  }

  getPermissions() {
    return Object.values(this.permissions);
  }

  setPermission(id, granted) {
    if (this.permissions[id]) {
      this.permissions[id].granted = granted;
      return true;
    }
    return false;
  }

  hasPermission(id) {
    return !!(this.permissions[id] && this.permissions[id].granted);
  }

  /**
   * Classify action risk level
   * @param {string} toolName 
   * @param {object} args 
   * @returns {'SAFE' | 'MODERATE' | 'DANGEROUS'}
   */
  evaluateRisk(toolName, args = {}) {
    const dangerousTools = ['delete_file', 'delete_folder', 'shutdown_computer', 'restart_computer', 'git_push_force', 'destructive_terminal'];
    if (dangerousTools.includes(toolName)) {
      return 'DANGEROUS';
    }

    if (toolName === 'run_terminal') {
      const command = (args.command || '').toLowerCase();
      const dangerousPatterns = ['rm -rf', 'format', 'drop database', 'git push --force', 'shutdown', 'del /f /s /q', 'rd /s /q'];
      if (dangerousPatterns.some(pattern => command.includes(pattern))) {
        return 'DANGEROUS';
      }
      return 'MODERATE';
    }

    if (['write_file', 'open_application', 'run_tests'].includes(toolName)) {
      return 'MODERATE';
    }

    return 'SAFE';
  }
}
