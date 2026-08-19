import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import { memoryStore } from '../memory/memoryStore.js';

const execAsync = promisify(exec);

// Comprehensive App & Web Registry
const APP_REGISTRY = {
  'vs code': 'code',
  'vscode': 'code',
  'visual studio code': 'code',
  'code': 'code',
  'whatsapp': 'whatsapp:',
  'wa': 'whatsapp:',
  'whatsapp desktop': 'whatsapp:',
  'excel': 'excel',
  'microsoft excel': 'excel',
  'word': 'winword',
  'microsoft word': 'winword',
  'powerpoint': 'powerpnt',
  'chrome': 'chrome',
  'google chrome': 'chrome',
  'edge': 'msedge',
  'msedge': 'msedge',
  'spotify': 'spotify',
  'terminal': 'wt',
  'cmd': 'cmd',
  'powershell': 'powershell',
  'notepad': 'notepad',
  'calculator': 'calc',
  'calc': 'calc',
  'explorer': 'explorer',
  'file explorer': 'explorer',
  'photoshop': 'photoshop',
  'yt': 'https://www.youtube.com',
  'youtube': 'https://www.youtube.com',
  'ig': 'https://www.instagram.com',
  'instagram': 'https://www.instagram.com',
  'fb': 'https://www.facebook.com',
  'facebook': 'https://www.facebook.com',
  'google': 'https://www.google.com',
  'github': 'https://github.com',
  'twitter': 'https://x.com',
  'x': 'https://x.com',
  'gmail': 'https://mail.google.com',
  'chatgpt': 'https://chatgpt.com'
};

function launchDesktopTarget(targetUrl) {
  if (process.platform === 'win32') {
    exec(`powershell -c "Start-Process '${targetUrl}'"`, (err) => {
      if (err) {
        console.warn('[osTools] PowerShell launch error, trying cmd fallback:', err.message);
        exec(`cmd.exe /c start "" "${targetUrl}"`);
      }
    });
  } else if (process.platform === 'darwin') {
    exec(`open "${targetUrl}"`);
  } else {
    exec(`xdg-open "${targetUrl}"`);
  }
}

export const osTools = {
  /**
   * Resolve application name, launch native Windows App (e.g. VS Code, WhatsApp Desktop), or fallback to browser
   */
  async open_application({ name }) {
    const cleanName = (name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
    let target = APP_REGISTRY[cleanName] || cleanName;

    // Fuzzy matching fallbacks
    if (cleanName.includes('code') || cleanName.includes('visual studio')) target = 'code';
    else if (cleanName.includes('whatsapp') || cleanName === 'wa') target = 'whatsapp:';
    else if (cleanName.includes('youtube') || cleanName === 'yt') target = 'https://www.youtube.com';
    else if (cleanName.includes('excel')) target = 'excel';
    else if (cleanName.includes('word')) target = 'winword';
    else if (cleanName.includes('chrome')) target = 'chrome';

    console.log(`[osTools] Opening app/URL: "${name}" -> clean: "${cleanName}" -> target: "${target}"`);

    // If target is VS Code
    if (target === 'code') {
      try {
        launchDesktopTarget('code');
        return {
          status: 'success',
          target: 'code',
          message: `Yep, launched VS Code.`
        };
      } catch (err) {
        console.error('[osTools] Error launching VS Code:', err);
      }
    }

    // If target is native WhatsApp protocol URI
    if (target === 'whatsapp:' || cleanName.includes('whatsapp')) {
      try {
        if (process.platform === 'win32') {
          launchDesktopTarget('whatsapp:');
          return {
            status: 'success',
            target: 'whatsapp:',
            message: `Yep, launched WhatsApp Desktop app.`
          };
        }
      } catch (e) {
        launchDesktopTarget('https://web.whatsapp.com');
        return {
          status: 'success',
          target: 'https://web.whatsapp.com',
          message: `Opened WhatsApp Web in your browser.`
        };
      }
    }

    // If target is a web URL
    if (target.startsWith('http://') || target.startsWith('https://')) {
      launchDesktopTarget(target);
      return {
        status: 'success',
        target,
        message: `Yep, opened ${cleanName} in your browser.`
      };
    }

    // Try launching local executable
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync(`where ${target}`).catch(() => ({ stdout: '' }));
        
        if (!stdout.trim() && !['calc', 'notepad', 'explorer', 'cmd', 'powershell', 'code', 'chrome', 'msedge', 'spotify', 'excel', 'winword'].includes(target)) {
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanName + ' official site')}`;
          console.log(`[osTools] Local app "${cleanName}" not found. Falling back to browser search: ${searchUrl}`);
          launchDesktopTarget(searchUrl);
          return {
            status: 'success',
            target: searchUrl,
            message: `Couldn't find ${cleanName} on your PC, so I opened the official browser search.`
          };
        }
      }

      launchDesktopTarget(target);
      return {
        status: 'success',
        target,
        message: `Yep, launched ${cleanName}.`
      };
    } catch (err) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanName + ' official link')}`;
      launchDesktopTarget(searchUrl);
      return {
        status: 'success',
        target: searchUrl,
        message: `Opened official browser search for ${cleanName}.`
      };
    }
  },

  /**
   * Close application process or browser tab safely (strictly excluding Localhost & MJ Assistant)
   */
  async close_application({ name }) {
    const cleanName = (name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
    console.log(`[osTools] Closing app/tab request: "${cleanName}"`);

    if (process.platform === 'win32') {
      // 1. WhatsApp Process & Tab Termination
      if (cleanName.includes('whatsapp') || cleanName === 'wa') {
        const psWhatsAppKill = `
          Get-Process | Where-Object { $_.ProcessName -like '*WhatsApp*' -or $_.MainWindowTitle -like '*WhatsApp*' } | Stop-Process -Force -ErrorAction SilentlyContinue;
          taskkill /IM WhatsApp.exe /F /T;
          taskkill /IM WhatsAppDesktop.exe /F /T;
          $wshell = New-Object -ComObject wscript.shell;
          if ($wshell.AppActivate('WhatsApp')) {
            Start-Sleep -Milliseconds 150;
            $wshell.SendKeys('^{w}');
          }
        `;
        exec(`powershell -c "${psWhatsAppKill.replace(/\n/g, ' ')}"`);
        return {
          status: 'success',
          message: `Yep, closed WhatsApp.`
        };
      }

      // 2. VS Code Process Termination
      if (cleanName.includes('code') || cleanName.includes('visual studio')) {
        const psCodeKill = `
          Get-Process | Where-Object { $_.ProcessName -like '*Code*' -or $_.MainWindowTitle -like '*Visual Studio Code*' } | Stop-Process -Force -ErrorAction SilentlyContinue;
          taskkill /IM Code.exe /F /T;
        `;
        exec(`powershell -c "${psCodeKill.replace(/\n/g, ' ')}"`);
        return {
          status: 'success',
          message: `Yep, closed VS Code.`
        };
      }

      // 3. YouTube Tab Closing (STRICT TARGETING ONLY - NEVER CLOSE LOCALHOST / MJ ASSISTANT)
      if (cleanName.includes('youtube') || cleanName === 'yt') {
        const psYtClose = `
          $wshell = New-Object -ComObject wscript.shell;
          if ($wshell.AppActivate('YouTube')) {
            Start-Sleep -Milliseconds 150;
            $wshell.SendKeys('^{w}');
          }
        `;
        exec(`powershell -c "${psYtClose.replace(/\n/g, ' ')}"`);
        return {
          status: 'success',
          message: `Yep, closed YouTube tab.`
        };
      }

      // 4. Generic Tab Closing (Excludes FRIDAY ASSISTANT & Localhost)
      if (cleanName === 'tab' || cleanName === 'active tab' || cleanName === 'browser tab') {
        const psTabClose = `
          $wshell = New-Object -ComObject wscript.shell;
          $activeTitle = (Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object -ExpandProperty MainWindowTitle);
          if (-not ($activeTitle -like '*FRIDAY*' -or $activeTitle -like '*MJ ASSISTANT*' -or $activeTitle -like '*localhost*' -or $activeTitle -like '*5173*')) {
            if ($wshell.AppActivate('Chrome') -or $wshell.AppActivate('Edge') -or $wshell.AppActivate('Firefox') -or $wshell.AppActivate('Brave')) {
              Start-Sleep -Milliseconds 150;
              $wshell.SendKeys('^{w}');
            }
          }
        `;
        exec(`powershell -c "${psTabClose.replace(/\n/g, ' ')}"`);
        return {
          status: 'success',
          message: `Yep, closed active browser tab.`
        };
      }

      // 5. Generic application process termination
      const psKillAll = `
        Get-Process | Where-Object { $_.ProcessName -like '*${cleanName}*' -or $_.MainWindowTitle -like '*${cleanName}*' } | Stop-Process -Force -ErrorAction SilentlyContinue;
        taskkill /IM "${cleanName}.exe" /F /T;
      `;
      exec(`powershell -c "${psKillAll.replace(/\n/g, ' ')}"`);

      return {
        status: 'success',
        message: `Gotcha, closed ${cleanName}.`
      };
    } else {
      await execAsync(`pkill -f "${cleanName}"`).catch(() => {});
      return {
        status: 'success',
        message: `Gotcha, closed ${cleanName}.`
      };
    }
  },

  /**
   * Send WhatsApp message to contact or phone number
   */
  async send_whatsapp_message({ recipient, message }) {
    console.log(`[osTools] Sending WhatsApp message to "${recipient}": "${message}"`);
    let phone = '';

    if (/^\+?\d{8,15}$/.test(recipient.replace(/[\s-]/g, ''))) {
      phone = recipient.replace(/[\s-]/g, '');
    } else {
      const savedContacts = memoryStore.search(recipient);
      if (savedContacts.length > 0) {
        const match = savedContacts[0].value.match(/\+?\d{8,15}/);
        if (match) phone = match[0];
      }
    }

    if (process.platform === 'win32') {
      exec(`powershell -c "set-clipboard '${message.replace(/'/g, "''")}'"`);
    }

    let whatsappUri = '';
    if (phone) {
      whatsappUri = `whatsapp://send?phone=${phone.replace('+', '')}&text=${encodeURIComponent(message)}`;
      launchDesktopTarget(whatsappUri);
      return {
        status: 'success',
        recipient,
        message: `Yep, opened WhatsApp chat for ${recipient} with pre-filled message: "${message}".`
      };
    }

    whatsappUri = `whatsapp://send?text=${encodeURIComponent(message)}`;
    launchDesktopTarget(whatsappUri);

    return {
      status: 'success',
      recipient,
      message: `Yep, opened WhatsApp for ${recipient} and copied your message "${message}" to clipboard! Just click ${recipient} and paste.`
    };
  },

  /**
   * Get CPU, RAM, Disk system metrics
   */
  async get_system_metrics() {
    try {
      const cpu = await si.currentLoad();
      const mem = await si.mem();
      const fsSize = await si.fsSize();

      const mainDisk = fsSize[0] || { use: 0, size: 0 };

      return {
        status: 'success',
        cpuUsage: `${Math.round(cpu.currentLoad)}%`,
        ramUsed: `${(mem.active / 1024 / 1024 / 1024).toFixed(1)} GB`,
        ramTotal: `${(mem.total / 1024 / 1024 / 1024).toFixed(1)} GB`,
        ramUsage: `${Math.round((mem.active / mem.total) * 100)}%`,
        diskUsage: `${Math.round(mainDisk.use || 0)}%`,
        message: `CPU: ${Math.round(cpu.currentLoad)}% | RAM: ${(mem.active / 1024 / 1024 / 1024).toFixed(1)}GB / ${(mem.total / 1024 / 1024 / 1024).toFixed(1)}GB (${Math.round((mem.active / mem.total) * 100)}%)`
      };
    } catch (err) {
      return {
        status: 'error',
        message: `Error fetching metrics: ${err.message}`
      };
    }
  },

  /**
   * Lock PC
   */
  async lock_computer() {
    try {
      if (process.platform === 'win32') {
        exec('rundll32.exe user32.dll,LockWorkStation');
      }
      return {
        status: 'success',
        message: 'Locked computer workstation.'
      };
    } catch (err) {
      return {
        status: 'error',
        message: `Couldn't lock workstation: ${err.message}`
      };
    }
  }
};
