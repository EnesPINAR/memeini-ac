const localtunnel = require('localtunnel');

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 3000, local_host: '127.0.0.1' });
    console.log('TUNNEL_ONLINE:', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 2 seconds...');
      setTimeout(startTunnel, 2000);
    });

    tunnel.on('error', (err) => {
      console.log('Tunnel error:', err.message, 'Reconnecting in 2 seconds...');
      setTimeout(startTunnel, 2000);
    });
  } catch (err) {
    console.log('Start error:', err.message, 'Retrying in 4 seconds...');
    setTimeout(startTunnel, 4000);
  }
}

startTunnel();

// Keep process alive indefinitely
setInterval(() => {}, 60000);
