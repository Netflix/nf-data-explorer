const inquirer = require('inquirer');
const clear = require('clear');
const path = require('path');
const { saveConfigFile } = require('./lib/utils/file-writer');
const { runCommandWithSpinner } = require('./lib/utils/commands');
const { section, title } = require('./lib/utils/log');
const chalk = require('chalk');

clear();

const SUPPORTED_DATASTORE_TYPES = 'SUPPORTED_DATASTORE_TYPES';
const DATASTORE_CASSANDRA = 'cassandra';
const DATASTORE_DYNOMITE = 'dynomite';
const DATASTORE_REDIS = 'redis';

async function promptForDatastores() {
  let answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: SUPPORTED_DATASTORE_TYPES,
      message: 'Select the types of datastores you want to support',
      choices: [
        {
          name: 'Cassandra',
          value: DATASTORE_CASSANDRA,
        },
        {
          name: 'Dynomite',
          value: DATASTORE_DYNOMITE,
        },
        {
          name: 'Redis',
          value: DATASTORE_REDIS,
        },
      ],
      validate: async function(selections) {
        if (selections.length === 0)
          return 'Please select at least one datastore';
        return true;
      },
    },
  ]);

  const datastoreSet = new Set(answers[SUPPORTED_DATASTORE_TYPES]);
  if (
    [DATASTORE_DYNOMITE, DATASTORE_REDIS].every(inMemoryDatastore =>
      datastoreSet.has(inMemoryDatastore),
    )
  ) {
    console.log('Currently Dynomite or Redis are supported but not both');
    answers = await promptForDatastores();
  }

  return answers;
}

/**
 * Kicks off the install and build.
 */
async function install() {
  await runCommandWithSpinner(
    'yarn',
    [],
    'Installing packages...',
    'Installed packages!',
  );
}

async function main() {
  console.log('');
  console.log(chalk.green('🚀 Initializing NF Data Explorer'));
  console.log('');
  console.log(
    chalk.grey(
      'Welcome to the NF Data Explorer! This tool will help you configure the environment for you by generating a config override file.',
    ),
  );
  console.log('');

  const datastoreAnswers = await promptForDatastores();

  let configAnswers = { ...datastoreAnswers };

  const setupDiscovery = require('./lib/discovery');
  configAnswers = { ...configAnswers, ...(await setupDiscovery()) };

  // optionally prompt for C*
  if (
    datastoreAnswers[SUPPORTED_DATASTORE_TYPES].indexOf(DATASTORE_CASSANDRA) >=
    0
  ) {
    const setupCassandra = require('./lib/datastores/cassandra');
    configAnswers = {
      ...configAnswers,
      ...(await setupCassandra(configAnswers['DISCOVERY_PROVIDER'])),
    };
  }
  // optionally prompt for Dynomite
  if (
    datastoreAnswers[SUPPORTED_DATASTORE_TYPES].indexOf(DATASTORE_DYNOMITE) >= 0
  ) {
    const setupDynomite = require('./lib/datastores/dynomite');
    configAnswers = {
      ...configAnswers,
      ...(await setupDynomite(configAnswers['DISCOVERY_PROVIDER'])),
    };
  }
  // optionally prompt for Redis
  if (
    datastoreAnswers[SUPPORTED_DATASTORE_TYPES].indexOf(DATASTORE_REDIS) >= 0
  ) {
    const setupDynomite = require('./lib/datastores/redis');
    configAnswers = {
      ...configAnswers,
      ...(await setupDynomite(configAnswers['DISCOVERY_PROVIDER'])),
    };
  }

  // optionally prompt for acls
  // const setupAcls = require('./lib/acls');
  // configAnswers = {
  //   ...configAnswers,
  //   ...(await setupAcls()),
  // };

  // NOTE since we can't have both dynomite and redis selected, but we needed to
  // know which option was selected above, before we write the config file,
  // we change redis -> dynomite.
  configAnswers = {
    ...configAnswers,
    [SUPPORTED_DATASTORE_TYPES]: configAnswers[
      SUPPORTED_DATASTORE_TYPES
    ].map((datastoreName) =>
      datastoreName === 'redis' ? 'dynomite' : datastoreName,
    ),
  };

  const configFileName = await saveConfigFile(
    path.join(__dirname, '../src/server/config/overrides'),
    configAnswers,
  );

  title('Setting up App...');
  section('Configuration complete. Setting up app...');
  await install();

  title(chalk.green('🎉 Congratulations!'));

  console.log(
    chalk.green('Generated override config file: ') +
      chalk.cyan(`${configFileName}`),
  );
  console.log(
    chalk.green('You can manually edit this file or run this script again.'),
  );
  console.log('');

  // dev mode instructions
  console.log(
    `${chalk.gray('To run in')} ${chalk.green('DEV')} ${chalk.gray('mode:')}`,
  );
  console.log(chalk.cyan(`yarn dev`));
  console.log('');

  // prod instructions
  console.log(
    `${chalk.gray('To run in')} ${chalk.green('PRODUCTION')} ${chalk.gray(
      'mode:',
    )}`,
  );
  console.log(chalk.gray(' Build the app: ') + chalk.cyan('yarn build'));
  console.log(
    chalk.gray(' Start the app: ') +
      chalk.cyan(`DATA_EXPLORER_CONFIG_NAME=${configFileName} && yarn start`),
  );

  // if the user might be using docker, give instructions on how to start containers
  if (
    configAnswers['DISCOVERY_PROVIDER'] === 'LocalDiscoveryProvider' ||
    configAnswers['DISCOVERY_PROVIDER'] === 'EnvironmentDiscoveryProvider'
  ) {
    console.log('');
    console.log(chalk.gray('To start a Cassandra and Redis container:'));
    console.log(
      `${chalk.gray(' Start containers:')} ${chalk.cyan(`yarn docker:dev`)}`,
    );
  }
}

main();
