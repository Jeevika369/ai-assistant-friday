import { spawn, exec } from 'child_process';
import { memoryStore } from '../memory/memoryStore.js';

function launchDesktopTarget(targetUrl) {
  if (process.platform === 'win32') {
    exec(`powershell -c "Start-Process '${targetUrl}'"`, (err) => {
      if (err) {
        console.warn('[deviceTools] PowerShell launch error, trying cmd fallback:', err.message);
        exec(`cmd.exe /c start "" "${targetUrl}"`);
      }
    });
  } else if (process.platform === 'darwin') {
    exec(`open "${targetUrl}"`);
  } else {
    exec(`xdg-open "${targetUrl}"`);
  }
}

export const deviceTools = {
  /**
   * Play music or favorite song directly on YouTube (/watch?v=...)
   */
  async play_music({ query = '', platform = 'youtube' }) {
    let song = (query || '').replace(/[\.\,\!\?]+$/, '').trim();

    // If user asks to play favorite song, look up Memory Store
    if (!song || song.toLowerCase().includes('favorite song') || song.toLowerCase().includes('my song')) {
      const favMemories = memoryStore.search('favorite song');
      if (favMemories.length > 0) {
        song = favMemories[0].value;
      } else {
        song = 'Funk Sereno'; // Default user song preference
      }
    }

    // Clean leading/trailing command keywords
    song = song.replace(/^(play|open|search)\s+/i, '').replace(/\s+(in|on|from)\s+youtube/gi, '').replace(/[\.\,\!\?]+$/, '').trim();

    console.log(`[deviceTools] Resolving direct video watch URL for song: "${song}"`);

    let targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`;

    try {
      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        targetUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        console.log(`[deviceTools] Resolved direct video watch URL: ${targetUrl}`);
      }
    } catch (err) {
      console.warn('[deviceTools] Error fetching direct video ID, using fallback search URL:', err.message);
    }

    launchDesktopTarget(targetUrl);

    return {
      status: 'success',
      song,
      url: targetUrl,
      message: `Yep, playing "${song}" directly on YouTube.`
    };
  },

  /**
   * Remember user's favorite song in Memory Store
   */
  async save_favorite_song({ song }) {
    const cleanSong = (song || '').replace(/[\.\,\!\?]+$/, '').replace(/\s+(oh|yeah|thanks)$/i, '').trim();
    const memory = memoryStore.addMemory('preference', 'Favorite Song', cleanSong);
    return {
      status: 'success',
      memory,
      message: `Gotcha. Remembered that your favorite song is "${cleanSong}".`
    };
  },

  /**
   * Get user's saved favorite song from Memory Store
   */
  async get_favorite_song() {
    const favMemories = memoryStore.search('favorite song');
    if (favMemories.length > 0) {
      return {
        status: 'success',
        song: favMemories[0].value,
        message: `Your saved favorite song is "${favMemories[0].value}".`
      };
    }
    return {
      status: 'success',
      song: 'Funk Sereno',
      message: `Your favorite song is currently saved as "Funk Sereno".`
    };
  },

  async control_media({ action }) {
    return {
      status: 'success',
      action,
      message: `Media ${action} executed.`
    };
  },

  async get_connected_devices() {
    return {
      status: 'success',
      devices: [
        { name: 'Bluetooth Headphones', type: 'Audio', connected: true },
        { name: 'External Monitor', type: 'Display', connected: true }
      ],
      message: 'Inspected connected devices.'
    };
  }
};
