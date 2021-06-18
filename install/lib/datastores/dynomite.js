const inquirer = require('inquirer');
const { section, title } = require('../utils/log');
const { validatePort } = require('../utils/ports');

async function setup(discoveryProvider) {
  title('Dynomite...');
  section('Dynomite Connection Settings');

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'DYNOMITE_REDIS_PORT',
      default: 8102,
      message: 'Specify the Dynomite port',
      validate:
        discoveryProvider === 'LocalDiscoveryProvider' ||
        discoveryProvider === 'EnvironmentDiscoveryProvider'
          ? validatePort
          : undefined,
    },
  ]);

  return answers;
}

module.exports = setup;
