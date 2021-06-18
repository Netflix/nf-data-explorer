const inquirer = require('inquirer');
const { title, section, info } = require('../utils/log');
const { validatePort } = require('../utils/ports');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

async function setupCassandra(discoveryProvider) {
  title('Cassandra...');

  const isLocal =
    discoveryProvider === 'LocalDiscoveryProvider' ||
    discoveryProvider === 'EnvironmentDiscoveryProvider';

  section('C* Authentication');
  info(
    'We have limited support for C* authentication. A single username/password can be used\n' +
      'for all clusters if required or running locally (by default C* has authentication turned on).',
  );

  let answers = {};
  const { authenticated } = await inquirer.prompt([
    {
      type: 'list',
      name: 'authenticated',
      message: 'Do your clusters support authentication',
      default: 'Yes',
      choices: ['Yes', 'No'],
    },
  ]);

  if (authenticated === 'Yes') {
    answers = {
      ...answers,
      ...(await inquirer.prompt([
        {
          type: 'input',
          name: 'CASSANDRA_BASE_AUTH_PROVIDER_USERNAME',
          message: 'C* username',
          default: 'cassandra',
        },
        {
          type: 'password',
          name: 'CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD',
          message: 'C* password',
          default: 'cassandra',
        },
      ])),
    };
  } else {
    answers = {
      CASSANDRA_BASE_AUTH_PROVIDER_USERNAME: undefined,
      CASSANDRA_BASE_AUTH_PROVIDER_PASSWORD: undefined,
    };
  }

  section('C* Connection Settings');
  answers = {
    ...answers,
    ...(await inquirer.prompt([
      {
        type: 'number',
        name: 'CASSANDRA_PORT',
        default: 9042,
        message: 'Specify the C* port',
        validate: isLocal ? validatePort : undefined,
      },
    ])),
  };

  if (!isLocal) {
    section('Client provider');
    info(
      'When connecting to cassandra, you can specify a number of connection options. These are encapsulated in a connection provider.',
    );
    answers = {
      ...answers,
      ...(await inquirer.prompt([
        {
          type: 'list',
          name: 'CASSANDRA_CLIENT_OPTIONS_PROVIDER',
          message: 'Choose a C* connection provider:',
          default: 'Yes',
          choices: [
            {
              name: 'Local',
              short: 'Local provider',
              value: 'LocalCassandraClientOptionsProvider',
            },
            {
              name: 'EC2',
              short: 'EC2 provider',
              value: 'EC2CassandraClientOptionsProvider',
            },
            {
              name: 'Custom - provide your own implementation with custom code',
              short: 'Custom provider',
              value: 'CustomCassandraClientOptionsProvider',
            },
          ],
        },
      ])),
    };
  }

  answers = {
    ...answers,
    ...(await getOptionalFeatures(isLocal)),
  };

  return answers;
}

async function getOptionalFeatures(isLocal) {
  section('C* Optional Features');
  const OPTIONAL_FEATURES = 'OPTIONAL_FEATURES';

  // expected to be boolean values defined in the base-config.ts file
  const config = {
    CASSANDRA_ALLOW_DROP_TABLE: {
      label: 'Allow Drop Table',
      short: 'Drop',
      checked: undefined,
    },
    CASSANDRA_ALLOW_TRUNCATE_TABLE: {
      label: 'Allow Truncate Table',
      short: 'Truncate',
      checked: undefined,
    },
    CASSANDRA_METRICS_SUPPORT: {
      label: 'Metrics*',
      short: 'Metrics*',
      checked: undefined,
    },
  };

  const baseConfigFile = await readFile(
    path.join(__dirname, '../../../src/server/config/base-config.ts'),
    'utf-8',
  );

  // find the default values from the base config file
  Object.keys(config).forEach(propertyName => {
    const re = new RegExp(
      `export\\s+const\\s+${propertyName}\\s*=\\s*(.*)\\s*;`,
    );
    const result = re.exec(baseConfigFile);
    if (result) {
      const [, defaultValue] = result;
      config[propertyName].checked = defaultValue === 'true';
    }
  });

  const optionalAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: OPTIONAL_FEATURES,
      message: 'Optional features (* indicates custom code is required)',
      choices: Object.entries(config).map(([propertyName, info]) => ({
        value: propertyName,
        name: info.label,
        short: info.short,
        checked: info.checked,
      })),
    },
  ]);

  const userFeatureSet = new Set(optionalAnswers[OPTIONAL_FEATURES]);
  let returnResult = {};
  Object.entries(config).forEach(([propertyName, info]) => {
    const featureEnabledByDefault = info.checked;
    const hasFeature = userFeatureSet.has(propertyName);
    if (!featureEnabledByDefault && hasFeature) {
      returnResult[propertyName] = true;
    } else if (featureEnabledByDefault && !hasFeature) {
      returnResult[propertyName] = false;
    }
  });

  if (!isLocal) {
    section('C* Destructive Operations');
    const { destructiveEnvs } = await inquirer.prompt({
      type: 'input',
      name: 'destructiveEnvs',
      default: 'test',
      message:
        'Allow destructive operations in the following accounts (separated by spaces):',
    });

    returnResult = {
      ...returnResult,
      CASSANDRA_ENVIRONMENTS_ALLOWING_DESTRUCTIVE_OPERATIONS: destructiveEnvs.split(
        ' ',
      ),
    };
  }

  return returnResult;
}

module.exports = setupCassandra;
