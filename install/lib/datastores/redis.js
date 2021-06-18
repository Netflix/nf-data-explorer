const inquirer = require('inquirer');
const { section, title } = require('../utils/log');
const { validatePort } = require('../utils/ports');

async function setupRedis(discoveryProvider) {
  title('Redis...');
  section('Redis Connection Settings');
  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'DYNOMITE_REDIS_PORT',
      default: 6379,
      message: 'Specify the Redis port',
      validate:
        discoveryProvider === 'LocalDiscoveryProvider' ||
        discoveryProvider === 'EnvironmentDiscoveryProvider'
          ? validatePort
          : undefined,
    },
  ]);
  return answers;
}

module.exports = setupRedis;
