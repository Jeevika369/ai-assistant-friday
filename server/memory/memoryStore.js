import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_FILE = path.join(__dirname, '../../data/memory.json');

export class MemoryStore {
  constructor() {
    this.memories = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
        this.memories = JSON.parse(raw);
      } else {
        // Initial default memory setup
        this.memories = [
          { id: 'mem_1', category: 'preference', key: 'Preferred Languages', value: 'JavaScript, Python, TypeScript', timestamp: new Date().toLocaleString() },
          { id: 'mem_2', category: 'project', key: 'Active Project', value: 'Friday Desktop AI Voice Companion', timestamp: new Date().toLocaleString() },
          { id: 'mem_3', category: 'semantic', key: 'Workflow Preference', value: 'Prefers concise, natural spoken responses and automated task execution', timestamp: new Date().toLocaleString() },
          { id: 'mem_4', category: 'episodic', key: 'Core Capabilities', value: 'Grok AI & Gemini dual reasoning, hands-free voice control, OS tool execution', timestamp: new Date().toLocaleString() }
        ];
        this.save();
      }
    } catch (e) {
      console.error('[MemoryStore] Error loading memory file:', e);
      this.memories = [];
    }
  }

  save() {
    try {
      const dir = path.dirname(MEMORY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memories, null, 2));
    } catch (e) {
      console.error('[MemoryStore] Error saving memory file:', e);
    }
  }

  getMemories() {
    return this.memories;
  }

  addMemory(category, key, value) {
    const entry = {
      id: `mem_${Date.now()}`,
      category,
      key,
      value,
      timestamp: new Date().toLocaleString()
    };
    this.memories.unshift(entry);
    this.save();
    return entry;
  }

  deleteMemory(id) {
    this.memories = this.memories.filter(m => m.id !== id);
    this.save();
  }

  clearAll() {
    this.memories = [];
    this.save();
  }

  search(query) {
    const q = query.toLowerCase();
    return this.memories.filter(m => 
      m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
    );
  }
}

export const memoryStore = new MemoryStore();
