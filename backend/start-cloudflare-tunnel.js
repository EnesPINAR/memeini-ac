const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_FILE_PATH = path.resolve(__dirname, '../src/services/api.ts');

let currentChild = null;

function updateApiTs(newUrl) {
  try {
    if (!fs.existsSync(API_FILE_PATH)) {
      console.warn('api.ts not found at:', API_FILE_PATH);
      return;
    }
    let content = fs.readFileSync(API_FILE_PATH, 'utf8');
    const regex = /export const TUNNEL_URL = '[^']+';/;
    if (regex.test(content)) {
      content = content.replace(regex, `export const TUNNEL_URL = '${newUrl}';`);
      fs.writeFileSync(API_FILE_PATH, content, 'utf8');
      console.log(`[API_TS_UPDATED] TUNNEL_URL set to: ${newUrl}`);
    } else {
      console.warn('TUNNEL_URL pattern not found in api.ts');
    }
  } catch (err) {
    console.error('Failed to update api.ts:', err.message);
  }
}

function startCloudflareTunnel() {
  console.log('[TUNNEL] Starting Cloudflare Quick Tunnel on port 3000...');
  
  // Use npx cloudflared
  const child = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', 'http://127.0.0.1:3000'], {
    shell: true,
  });

  currentChild = child;
  let urlFound = false;

  const handleData = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      const tunnelUrl = match[0];
      console.log('\n========================================');
      console.log('TUNNEL_ONLINE:', tunnelUrl);
      console.log('========================================\n');
      updateApiTs(tunnelUrl);
    }
  };

  child.stdout.on('data', handleData);
  child.stderr.on('data', handleData);

  child.on('close', (code) => {
    console.log(`[TUNNEL] Process exited with code ${code}. Reconnecting in 3s...`);
    currentChild = null;
    setTimeout(startCloudflareTunnel, 3000);
  });

  child.on('error', (err) => {
    console.error('[TUNNEL] Process error:', err.message);
    currentChild = null;
    setTimeout(startCloudflareTunnel, 3000);
  });
}

process.on('SIGINT', () => {
  if (currentChild) currentChild.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (currentChild) currentChild.kill();
  process.exit(0);
});

startCloudflareTunnel();

// Keep process alive indefinitely
setInterval(() => {}, 60000);
