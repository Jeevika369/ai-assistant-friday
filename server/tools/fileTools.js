import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export const fileTools = {
  /**
   * Search for files by keyword or extension
   */
  async search_files({ query, rootDir }) {
    const searchDir = rootDir || config.workspaceRoot || process.cwd();
    try {
      if (!fs.existsSync(searchDir)) {
        return { status: 'error', message: `Directory does not exist: ${searchDir}` };
      }

      const results = [];
      const searchRecursive = (dir, depth = 0) => {
        if (depth > 4) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            searchRecursive(fullPath, depth + 1);
          } else if (entry.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(fullPath);
          }
        }
      };

      searchRecursive(rootDir);

      return {
        status: 'success',
        query,
        count: results.length,
        files: results.slice(0, 15),
        message: `Found ${results.length} files matching "${query}".`
      };
    } catch (err) {
      return { status: 'error', message: `File search failed: ${err.message}` };
    }
  },

  /**
   * Read file content safely
   */
  async read_file({ filePath }) {
    try {
      if (!fs.existsSync(filePath)) {
        return { status: 'error', message: `File not found: ${filePath}` };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        status: 'success',
        filePath,
        content: content.length > 5000 ? content.slice(0, 5000) + '\n...[Truncated]' : content
      };
    } catch (err) {
      return { status: 'error', message: `Could not read file: ${err.message}` };
    }
  },

  /**
   * Write or edit file content
   */
  async write_file({ filePath, content }) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      return {
        status: 'success',
        filePath,
        message: `Saved changes to ${path.basename(filePath)}.`
      };
    } catch (err) {
      return { status: 'error', message: `Could not write file: ${err.message}` };
    }
  }
};
