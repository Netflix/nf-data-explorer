const chalk = require('chalk');

function title(message) {
  console.log('');
  console.log(chalk.cyan('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
  console.log(chalk.cyan(`  ${message}`));
  console.log(chalk.cyan('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
}

function section(message) {
  console.log('');
  console.log(chalk.black.bgCyan(`${message}`));
}

function info(message) {
  console.log(chalk.grey(message));
}

module.exports = {
  info,
  section,
  title,
};
