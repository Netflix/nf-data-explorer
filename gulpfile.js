const { parallel, series, src, dest, task } = require('gulp');
const del = require('del');
const { readdirSync } = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const nodemon = require('gulp-nodemon');
const inquirer = require('inquirer');

let configFile = undefined;

// **************************
//  INSTALL
// **************************

function install(done) {
  return runShell('yarn install --frozen-lockfile', undefined, done);
}

// **************************
//  CLEANING AND PUBLISHING
// **************************

async function clean() {
  await del([
    'dist',
    'src/server/public',
    'src/client/dist',
    'src/client/src/shared/*',
  ]);
}

function copySharedSrc() {
  return src('src/server/shared/**/*').pipe(dest('src/client/src/shared'));
}

function publishClientToServer() {
  return src('src/client/dist/**/*')
    .pipe(dest('src/server/public'))
    .pipe(dest('dist/public'));
}

// **************************
//  CLIENT/SERVER BUILD
// **************************

function buildClient(done) {
  runShell('yarn build', 'src/client', done);
}

function buildServer(done) {
  // just run `tsc` rather than use the gulp-typescript plugin.
  // output of`tsc` is much nicer, generates consistent source maps,
  // and spares an extra dependency.
  runShell('yarn tsc', undefined, done);
}

// wrap `buildServer` in a task so nodemon can call it
task('buildServer', buildServer);

/**
 * Helper for running a shell command.
 * @param cmd Command string (e.g. "yarn install")
 * @param cwd Current working directory or undefined for current.
 * @param done Done callback.
 */
function runShell(cmd, cwd, done) {
  const [command, ...args] = cmd.split(' ');
  const proc = spawn(command, args, {
    stdio: 'inherit',
    cwd: cwd ? path.resolve(cwd) : undefined,
  });
  return proc.on('close', (status) => {
    if (status !== 0) {
      done(new Error(`Command "${cmd}" failed with return code: ${status}`));
    } else {
      done();
    }
  });
}

function watchClient(done) {
  return runShell('yarn serve', './src/client', done);
}

// **************************
//  CONFIG FILE MANAGEMENT
// **************************

async function loadConfig(done) {
  const availableOverrides = readdirSync('./src/server/config/overrides')
    .filter((filename) => filename.endsWith('.ts'))
    .map((filename) => filename.split('.')[0]);

  if (availableOverrides.length > 1) {
    try {
      const answers = await inquirer.prompt([
        {
          name: 'configFile',
          type: 'list',
          choices: availableOverrides,
          message: 'Multiple configuration files found. Please choose one:',
        },
      ]);
      configFile = answers.configFile;
      done();
    } catch (err) {
      done(err);
    }
  } else if (availableOverrides.length === 1) {
    configFile = availableOverrides[0];
  } else {
    done();
  }
}

// **************************
//  NODEMON
// **************************

function nodeDevServer(done) {
  const stream = nodemon({
    script: 'dist/index.js',
    watch: ['./src/server'],
    tasks: 'buildServer',
    ext: 'ts',
    nodeArgs: ['--inspect', '--max-http-header-size=81920'],
    env: {
      NODE_ENV: 'development',
      // use the config file chosen by the user or use undefined to use base config
      DATA_EXPLORER_CONFIG_NAME: configFile,
    },
  });

  stream
    .on('start', (msg) => {
      console.log(`nodemon started: ${msg}`);
    })
    .on('restart', (msg) => {
      console.log(`restarted! due to ${msg}`);
    })
    .on('crash', () => {
      console.error('Application has crashed!\n');
      stream.emit('restart', 10); // restart the server in 10 seconds
    })
    .on('quit', () => {
      console.log('quit');
      done();
    });

  return stream;
}

// **************************
//  DOCKER DEV ENV
// **************************

function dockerDevEnv(done) {
  runShell('yarn docker:dev', undefined, done);
}

// **************************
//  TESTS
// **************************

function testServer(done) {
  runShell('yarn test:unit', undefined, done);
}

function testClient(done) {
  runShell('yarn test:unit', './src/client', done);
}

// **************************
//  EXPORTED BUILD TASKS
// **************************

const build = series(
  buildServer,
  copySharedSrc,
  buildClient,
  publishClientToServer,
);
const test = series(copySharedSrc, testServer, testClient);

exports.build = build;

exports.ci = series(clean, install, build, test);

exports.clean = clean;

exports.dev = series(
  copySharedSrc,
  dockerDevEnv,
  loadConfig,
  buildServer,
  parallel(nodeDevServer, watchClient),
);

exports.test = series(build, test); // tests need some static files in the server directory
