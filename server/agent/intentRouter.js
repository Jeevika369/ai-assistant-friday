/**
 * Fast deterministic intent router for natural desktop commands with aggressive string & wake-word sanitization
 */
export function routeIntent(text) {
  // 1. Strip non-alphanumeric punctuation
  let clean = (text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();

  // 2. Strip leading wake words ("friday ", "hey friday ", "hi friday ", "hello friday ", "okay friday ", "ok friday ", "mj ", "assistant ")
  clean = clean.replace(/^(hey\s+friday|hi\s+friday|hello\s+friday|ok\s+friday|okay\s+friday|friday|hey\s+mj|hi\s+mj|ok\s+mj|okay\s+mj|mj|assistant)\s+/, '').trim();

  console.log(`[intentRouter] Cleaned intent input: "${text}" -> "${clean}"`);

  // 3. Close Application or Browser Tab Router (Matches "can you close whatsapp", "close whatsapp", "close vs code", "close youtube", "close tab")
  if (clean.includes('close ') || clean.includes('quit ') || clean.includes('exit ') || clean.includes('close tab')) {
    let target = clean.replace(/^.*?(close|quit|exit)\s+/, '').trim();
    if (clean.includes('close tab') || clean.includes('browser tab')) {
      target = clean.replace(/^.*?(close|quit|exit)\s+(browser\s+)?tab\s*/gi, '').trim() || 'tab';
    }
    return { tool: 'close_application', args: { name: target } };
  }

  // 4. Favorite Song Query & Memory Persistence Router
  if (clean.includes('what is my favorite song') || clean.includes('tell me my favorite song') || clean.includes('get my favorite song')) {
    return { tool: 'get_favorite_song', args: {} };
  }

  if (
    clean.includes('favorite song is ') ||
    clean.includes('favorite song as ') ||
    clean.includes('favorite song to ') ||
    clean.startsWith('remember my favorite song') ||
    clean.startsWith('set my favorite song')
  ) {
    const match = clean.match(/(?:favorite song is|favorite song as|favorite song to|remember my favorite song is|remember my favorite song|set my favorite song as|set my favorite song to)\s+(.+)/i);
    if (match && match[1]) {
      const songName = match[1].replace(/\s+(oh|yeah|thanks)$/i, '').trim();
      return { tool: 'save_favorite_song', args: { song: songName } };
    }
  }

  // 5. Music & Song Intent Router
  if (clean.startsWith('play ') || clean.includes('in youtube') || clean.includes('on youtube')) {
    let songQuery = clean;
    if (clean.startsWith('play ')) {
      songQuery = clean.replace(/^play\s+/, '').replace(/\s+(in|on|from)\s+youtube/gi, '').trim();
    } else {
      songQuery = clean.replace(/\s+(in|on|from)\s+youtube/gi, '').trim();
    }

    if (songQuery.includes('favorite song') || songQuery.includes('my song')) {
      return { tool: 'play_music', args: { query: 'my favorite song' } };
    }

    if (songQuery) {
      return { tool: 'play_music', args: { query: songQuery } };
    }
  }

  // 6. Flexible WhatsApp Messaging Intent Router (Supports multi-word contact names like "Sudan AU" or "Sudha AU")
  if (
    clean.includes('whatsapp') ||
    clean.startsWith('send ') ||
    clean.startsWith('msg ') ||
    clean.startsWith('message ') ||
    clean.startsWith('tell ')
  ) {
    if (clean.includes('message') || clean.includes('whatsapp') || clean.startsWith('msg ') || clean.startsWith('tell ')) {
      let textWithoutPlatform = clean.replace(/\s+(in|on|via)\s+whatsapp/gi, '').trim();

      let matchA = textWithoutPlatform.match(/^(?:send|msg|message|tell)\s+(.+?)\s+(?:message\s+)?to\s+(.+)$/i);
      if (matchA) {
        const messageText = matchA[1].replace(/^(a\s+)?message\s+/, '').trim();
        const recipient = matchA[2].trim();
        if (messageText && recipient) {
          return { tool: 'send_whatsapp_message', args: { recipient, message: messageText } };
        }
      }

      let matchB = textWithoutPlatform.match(/^(?:send\s+(?:a\s+)?message|msg|message|tell)\s+(?:to\s+)?(.+?)\s+(?:saying|with|that)\s+(.+)$/i);
      if (matchB) {
        const recipient = matchB[1].trim();
        const messageText = matchB[2].trim();
        if (messageText && recipient) {
          return { tool: 'send_whatsapp_message', args: { recipient, message: messageText } };
        }
      }
    }
  }

  // 7. Application & Web App Launcher
  if (clean.startsWith('open ') || clean.startsWith('launch ') || clean.startsWith('start ') || clean.includes('open ') || clean.includes('launch ')) {
    let app = clean.replace(/^(open|launch|start)\s+/, '').trim();
    if (clean.includes('open ')) {
      app = clean.substring(clean.indexOf('open ') + 5).trim();
    }

    if (
      app === 'yt' || app === 'youtube' ||
      app === 'ig' || app === 'instagram' ||
      app === 'fb' || app === 'facebook' ||
      app === 'google' || app === 'github' ||
      app === 'twitter' || app.includes('.com') || app.includes('http')
    ) {
      return { tool: 'open_url', args: { url: app } };
    }
    return { tool: 'open_application', args: { name: app } };
  }

  // 8. Browser Search
  if (clean.startsWith('search youtube for ')) {
    const query = clean.replace('search youtube for ', '').trim();
    return { tool: 'browser_search', args: { query, platform: 'youtube' } };
  }
  if (clean.startsWith('search github for ')) {
    const query = clean.replace('search github for ', '').trim();
    return { tool: 'browser_search', args: { query, platform: 'github' } };
  }
  if (clean.startsWith('search stackoverflow for ')) {
    const query = clean.replace('search stackoverflow for ', '').trim();
    return { tool: 'browser_search', args: { query, platform: 'stackoverflow' } };
  }
  if (clean.startsWith('search for ') || clean.startsWith('google ')) {
    const query = clean.replace(/^(search for|google)\s+/, '').trim();
    return { tool: 'browser_search', args: { query, platform: 'google' } };
  }

  // 9. File System
  if (clean.startsWith('find file ') || clean.startsWith('search files for ') || clean.startsWith('find my ')) {
    const query = clean.replace(/^(find file|search files for|find my)\s+/, '').trim();
    return { tool: 'search_files', args: { query } };
  }

  // 10. System Metrics & Operations
  if (clean.includes('system status') || clean.includes('cpu usage') || clean.includes('ram usage') || clean.includes('disk space')) {
    return { tool: 'get_system_metrics', args: {} };
  }

  if (clean.includes('lock computer') || clean.includes('lock my pc') || clean.includes('lock laptop')) {
    return { tool: 'lock_computer', args: {} };
  }

  // 11. Coding & Terminal
  if (clean.includes('git status') || clean.includes('what changed')) {
    return { tool: 'git_status', args: {} };
  }

  if (clean.includes('run tests') || clean.includes('test code')) {
    return { tool: 'run_tests', args: {} };
  }

  if (clean.startsWith('remind me to ') || clean.startsWith('remind me in ')) {
    return { tool: 'create_reminder', args: { title: text, minutes: 10 } };
  }

  // Fallback to LLM general conversation / reasoning
  return null;
}
