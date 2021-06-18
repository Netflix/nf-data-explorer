const inquirer = require('inquirer');
const { info, title } = require('./utils/log');

async function setupAcls() {
  title('Authentication/Authorization');
  info(
    'The data explorer supports a number of levels of acccess control.\n' +
      '👤 - Authentication\n' +
      '🔐 - Optional cluster and entity-level authorization.\n' +
      'Note: Enabling cluster and entity ACLs will require custom code to be written.',
  );

  let answers = {};

  const REQUIRE_AUTHENTICATION = 'REQUIRE_AUTHENTICATION';
  const authAnswers = await inquirer.prompt({
    type: 'confirm',
    name: REQUIRE_AUTHENTICATION,
    message:
      'Require authentication (users must have a valid authentication token)?',
  });
  answers = {
    ...answers,
    ...authAnswers,
  };

  // auth is required for
  if (authAnswers[REQUIRE_AUTHENTICATION]) {
    const { ok } = await inquirer.prompt({
      type: 'confirm',
      name: 'ok',
      message: 'Do you want to support cluster-level ACLs',
    });

    if (ok) {
      console.log('yes, need to support access control...');
    } else {
      console.log('no thanks');
    }
  }

  // answers = {
  //   ...answers,
  //   ...(await inquirer.prompt({
  //     type: 'confirm',
  //     message: 'Do you want to support '
  //   })),
  // }

  return answers;
}

module.exports = setupAcls;
