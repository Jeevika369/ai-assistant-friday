import { spawn, exec } from 'child_process';
import { chromium } from 'playwright';

let browserInstance = null;
let pageInstance = null;

async function getPage() {
  if (!browserInstance) {
    browserInstance = await chromium.launch({ headless: true });
    const context = await browserInstance.newContext();
    pageInstance = await context.newPage();
  }
  return pageInstance;
}

function launchDesktopTarget(targetUrl) {
  if (process.platform === 'win32') {
    // PowerShell Start-Process is 100% reliable on Windows for URLs, apps & protocols
    exec(`powershell -c "Start-Process '${targetUrl}'"`, (err) => {
      if (err) {
        console.warn('[browserTools] PowerShell launch error, trying cmd fallback:', err.message);
        exec(`cmd.exe /c start "" "${targetUrl}"`);
      }
    });
  } else if (process.platform === 'darwin') {
    exec(`open "${targetUrl}"`);
  } else {
    exec(`xdg-open "${targetUrl}"`);
  }
}

export const browserTools = {
  /**
   * Visibly open URL in user's primary desktop browser
   */
  async open_url({ url }) {
    try {
      let targetUrl = (url || '').trim().toLowerCase();

      // Resolve aliases
      if (targetUrl === 'yt' || targetUrl.includes('youtube')) targetUrl = 'https://www.youtube.com';
      else if (targetUrl === 'wa' || targetUrl.includes('whatsapp')) targetUrl = 'https://web.whatsapp.com';
      else if (targetUrl === 'ig' || targetUrl.includes('instagram')) targetUrl = 'https://www.instagram.com';
      else if (targetUrl.includes('github')) targetUrl = 'https://github.com';
      else if (targetUrl.includes('google')) targetUrl = 'https://www.google.com';
      else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      console.log(`[browserTools] Visibly opening URL via PowerShell/OS: "${targetUrl}"`);
      launchDesktopTarget(targetUrl);

      return {
        status: 'success',
        url: targetUrl,
        message: `Yep, opened ${targetUrl} in your browser.`
      };
    } catch (err) {
      console.error('[browserTools] Error opening URL:', err);
      return {
        status: 'error',
        message: `Browser navigation error: ${err.message}`
      };
    }
  },

  /**
   * Search Google, YouTube, GitHub, StackOverflow via Playwright in background
   */
  async browser_search({ query, platform = 'google' }) {
    try {
      let searchUrl = '';

      switch (platform.toLowerCase()) {
        case 'youtube':
          searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          break;
        case 'github':
          searchUrl = `https://github.com/search?q=${encodeURIComponent(query)}`;
          break;
        case 'stackoverflow':
          searchUrl = `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`;
          break;
        case 'google':
        default:
          searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          break;
      }

      // Visibly open search URL for user
      launchDesktopTarget(searchUrl);

      const page = await getPage();
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      const searchResults = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('h3, h2, a[data-testid="result-title-a"]'));
        return items.slice(0, 5).map(el => el.innerText.trim()).filter(Boolean);
      });

      return {
        status: 'success',
        query,
        platform,
        url: searchUrl,
        results: searchResults.length ? searchResults : ['Search page opened successfully'],
        message: `Opened search for "${query}" on ${platform}.`
      };
    } catch (err) {
      return {
        status: 'error',
        message: `Search error on ${platform}: ${err.message}`
      };
    }
  }
};
