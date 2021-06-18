const ora = require('ora');
const chalk = require('chalk');

const spinner = ora('');

function startSpinner(msg) {
  spinner.text = msg;
  spinner.start();
}

function stopSpinner(msg) {
  if (msg) {
    spinner.stopAndPersist({
      symbol: chalk.green('✔'),
      text: msg,
    });
  } else {
    spinner.stop();
  }
}

module.exports = {
  startSpinner,
  stopSpinner,
};
