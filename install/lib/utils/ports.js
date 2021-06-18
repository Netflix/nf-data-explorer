const detectPort = require('detect-port');

async function isPortAvailable(port) {
  const availablePort = await detectPort(port);
  return availablePort === port;
}

async function validatePort(port) {
  if (await isPortAvailable(port)) {
    console.log(
      `Note: server does not appear to be running on this port. You might want to check that...`,
    );
  }
  return true;
}

module.exports = {
  validatePort,
};
