import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { PermissionManager } from './security/permissionManager.js';
import { AuditLogger } from './security/auditLogger.js';
import { MemoryStore } from './memory/memoryStore.js';
import { ActivityTracker } from './memory/activityTracker.js';
import { ProjectTracker } from './memory/projectTracker.js';
import { AgentCore } from './agent/agentCore.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(json);
    }
  });
}

const permissionManager = new PermissionManager();
const auditLogger = new AuditLogger(broadcast);
const memoryStore = new MemoryStore();
const activityTracker = new ActivityTracker();
const projectTracker = new ProjectTracker(config.workspaceRoot);
const agentCore = new AgentCore(permissionManager, auditLogger, memoryStore, activityTracker, projectTracker);

auditLogger.log('SYSTEM_STARTUP', 'FridayCore', `FRIDAY Desktop Assistant Server listening on port ${config.port}`);

wss.on('connection', (ws) => {
  console.log('[Friday Server] WebSockets client connected.');

  ws.send(JSON.stringify({
    type: 'MEMORY_UPDATE',
    memories: memoryStore.getMemories()
  }));

  ws.send(JSON.stringify({
    type: 'PERMISSIONS_UPDATE',
    permissions: permissionManager.getPermissions()
  }));

  ws.on('message', async (messageStr) => {
    try {
      const data = JSON.parse(messageStr.toString());
      console.log('[Friday Server WS Received]:', data.type);

      const sendWsMessage = (msg) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(msg));
        }
      };

      if (data.type === 'USER_INPUT') {
        await agentCore.processInput(data.text, sendWsMessage, data.image || null, data.language || 'en');
      } else if (data.type === 'CONFIRM_AUTHORIZATION') {
        await agentCore.handleAuthorization(data.requestId, data.approved, sendWsMessage);
      }
    } catch (err) {
      console.error('[Friday Server WS Error]:', err);
    }
  });

  ws.on('close', () => {
    console.log('[Friday Server] WebSockets client disconnected.');
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: config.name,
    version: '1.0.0',
    port: config.port,
    aiProvider: config.primaryProvider,
    grokConfigured: Boolean(config.grokApiKey),
    geminiConfigured: Boolean(config.geminiApiKey),
    memoryCount: memoryStore.getMemories().length,
    timestamp: new Date().toISOString()
  });
});

server.listen(config.port, () => {
  console.log(`\n==================================================`);
  console.log(`  FRIDAY Desktop AI Companion Engine Active      `);
  console.log(`  Models: Grok AI (xAI) + Gemini Multi-Model     `);
  console.log(`  WebSocket Server: ws://localhost:${config.port}`);
  console.log(`  REST API Health:  http://localhost:${config.port}/api/health`);
  console.log(`==================================================\n`);
});
