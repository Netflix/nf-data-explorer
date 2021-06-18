const inquirer = require('inquirer');
const { title, section, info } = require('./utils/log');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const exists = promisify(fs.exists);
const Ajv = require('ajv').default;
const discoverySchema = require('../../schema/discovery-schema.json');

async function setupDiscovery() {
  title('Discovery...');
  const discoveryMethod = 'DISCOVERY_PROVIDER';

  let answers = {};
  answers = {
    ...answers,
    ...(await inquirer.prompt([
      {
        type: 'list',
        name: discoveryMethod,
        message: 'How do you want to discover available clusters?',
        choices: [
          {
            name: '💻 localhost - point to a local cluster',
            short: 'using localhost 💻',
            value: 'LocalDiscoveryProvider',
          },
          {
            name:
              '🌐 environment variables - supports a single C* and single Dynomite/Redis cluster',
            short: 'using environment variables 🌐',
            value: 'EnvironmentDiscoveryProvider',
          },
          {
            name:
              '📂 file system - watch a file containing the cluster names and hosts/IPs (suitable for EC2 deployment)',
            short: 'using file system 📁',
            value: 'FileSystemDiscoveryProvider',
          },
          {
            name: '️️️🖍️ custom (requires custom code)',
            short: 'using Custom Class 🖍️',
            value: 'CustomDiscoveryProvider',
          },
        ],
      },
    ])),
  };

  if (answers[discoveryMethod] === 'FileSystemDiscoveryProvider') {
    section('File System');
    info(
      'The JSON file will contain the cluster information (the name, environment, regions, and instances).',
    );
    answers = {
      ...answers,
      ...(await inquirer.prompt({
        type: 'input',
        name: 'DISCOVERY_PROVIDER_FILESYSTEM_SOURCE',
        default: 'discovery.json',
        message:
          'Name of discovery JSON file (will reside in data dir of project root)',
        validate: async (value) => {
          const jsonFile = path.join(__dirname, '../../data/', value);
          if (!(await exists(jsonFile))) {
            return `File does not exist: ${jsonFile}`;
          }
          const statResult = await stat(jsonFile);
          if (!statResult.isFile()) {
            return `Path is not a file: ${jsonFile}`;
          }

          // validate the provided discovery JSON file
          const validator = new Ajv({
            allErrors: true,
            async: true,
            strict: false,
          });
          const validate = validator.compile(discoverySchema);
          const discoveryContent = await readFile(jsonFile, 'utf-8');
          const isValid = await validate(JSON.parse(discoveryContent));

          if (isValid) {
            return true;
          } else {
            const errorMsgs = validate.errors.map(
              (error) => `  ❌ [${error.dataPath}] - ${error.message}`,
            );
            return `Discovery file is invalid. Found the following schema validation errors:\n${errorMsgs.join(
              '\n',
            )}\nPlease open the discovery.json file in VS Code to get hints on how to fix the errors.`;
          }
        },
      })),
    };

    section('Cloud Provider Accounts');
    info(
      'The data explorer app is assumed to be deployed in each environment/region that you have your datastores deployed in.\n' +
        'This deployment strategy will avoid cross-region calls. When choosing a cluster in another region, users will be redirected to that region.\n' +
        'In order to redirect you to the correct region, please specify which accounts and regions this app will be deployed in.',
    );

    // specify accounts and regions
    const { environments } = await inquirer.prompt({
      type: 'input',
      name: 'environments',
      default: 'test prod',
      message: 'Enter the names of your accounts (separated by spaces):',
    });

    const { regions } = await inquirer.prompt({
      type: 'input',
      name: 'regions',
      default: 'us-east-1 eu-west-1 us-west-2',
      message: 'Enter the names of your regions (separated by spaces):',
    });

    answers = {
      ...answers,
      ENVIRONMENTS: environments.split(' '),
      REGIONS: regions.split(' '),
    };
  } else if (answers[discoveryMethod] === 'CustomDiscoveryProvider') {
    // generate stub class and git add it
  }

  return answers;
}

module.exports = setupDiscovery;
