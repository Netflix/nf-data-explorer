const childProcess = require('child_process');
const { startSpinner, stopSpinner } = require('./spinner');

function runCommnand(cmd, args) {
  return new Promise((resolve, reject) => {
    const yarnProcess = childProcess.spawn(cmd, args);
    let yarnOutput = '';
    yarnProcess.stdout.on('data', data => (yarnOutput += `${data}`));
    yarnProcess.stderr.on('data', data => (yarnOutput += `${data}`));
    yarnProcess.on('close', () => {
      resolve(yarnOutput);
    });
  });
}

async function runCommandWithSpinner(cmd, args, startMessage, finishMessage) {
  startSpinner(startMessage || 'Loading...');
  try {
    output = await runCommnand(cmd, args);
  } catch (err) {
    console.log(output);
    process.exit(1);
  } finally {
    stopSpinner(finishMessage || 'Finished');
  }
}

module.exports = {
  runCommnand,
  runCommandWithSpinner,
};
