export class ActivityTracker {
  constructor() {
    this.activities = [];
  }

  recordActivity(type, title, metadata = {}) {
    const item = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type, // 'APP_LAUNCH', 'FILE_EDIT', 'BROWSER_NAV', 'TERMINAL_CMD', 'CONVERSATION'
      title,
      metadata
    };
    this.activities.unshift(item);
    if (this.activities.length > 100) this.activities.pop();
    return item;
  }

  getRecentActivities(limit = 10) {
    return this.activities.slice(0, limit);
  }

  getRecentContext() {
    const apps = this.activities.filter(a => a.type === 'APP_LAUNCH').slice(0, 3).map(a => a.title);
    const files = this.activities.filter(a => a.type === 'FILE_EDIT').slice(0, 3).map(a => a.title);
    const cmds = this.activities.filter(a => a.type === 'TERMINAL_CMD').slice(0, 3).map(a => a.title);
    
    return {
      recentApps: apps,
      recentFiles: files,
      recentCommands: cmds,
      lastActivity: this.activities[0] || null
    };
  }
}
