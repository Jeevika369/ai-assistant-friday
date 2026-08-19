import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '../../data/audit.jsonl');

// Ensure directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export class AuditLogger {
  constructor(broadcastCallback) {
    this.broadcastCallback = broadcastCallback;
    this.logs = [];
  }

  log(action, tool, details, status = 'SUCCESS') {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      isoTimestamp: new Date().toISOString(),
      action,
      tool,
      details,
      status
    };

    this.logs.unshift(entry);
    if (this.logs.length > 200) this.logs.pop();

    // Append to jsonl file asynchronously
    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch (e) {
      console.error('[AuditLogger] Error writing audit file:', e);
    }

    // Broadcast to UI
    if (this.broadcastCallback) {
      this.broadcastCallback({
        type: 'AUDIT_LOG',
        log: entry
      });
    }

    return entry;
  }

  getLogs() {
    return this.logs;
  }
}
