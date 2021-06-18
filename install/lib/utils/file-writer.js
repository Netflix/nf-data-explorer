const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');
const { promisify } = require('util');
const { title } = require('./log');
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

async function saveConfigFile(configDir, answers) {
  title('Ready to Save Configuration');

  const { configFileName } = await inquirer.prompt({
    type: 'input',
    name: 'configFileName',
    message: 'Config file name:',
    default: 'custom-config',
    validate(value) {
      if (value.length === 0) {
        return 'Please specify a filename';
      }
      return true;
    },
  });

  // write the custom config file
  const fileContentsArray = [];
  for (const [key, value] of Object.entries(answers)) {
    let wrappedValue;
    if (Array.isArray(value)) {
      wrappedValue = JSON.stringify(value).replace(/"/g, "'");
    } else {
      wrappedValue = typeof value === 'string' ? `'${value}'` : value;
    }
    fileContentsArray.push(`export const ${key} = ${wrappedValue};`);
  }
  if (!(await exists(configDir))) {
    await mkdir(configDir, { recursive: true });
  }
  await writeFile(
    path.join(configDir, `${configFileName}.ts`),
    [...fileContentsArray, ''].join('\n'),
  );
  return configFileName;
}

module.exports = {
  saveConfigFile,
};
