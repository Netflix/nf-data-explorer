// eslint-disable-next-line @typescript-eslint/no-var-requires
const opn = require('opn');
const HOSTNAME = 'localhost';

module.exports = {
  // configure webpack-dev-server behavior
  devServer: {
    proxy: {
      '/REST': {
        target: 'http://localhost',
      },
      '/healthcheck': {
        target: 'http://localhost',
      },
    },
    historyApiFallback: {
      disableDotRule: true,
    },
    port: 3000,
    public: HOSTNAME,
    allowedHosts: [HOSTNAME],
    after: function () {
      opn(`http://${HOSTNAME}:3000`);
    },
  },

  pwa: {
    name: 'Netflix Data Explorer',
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/service-worker.js',
    },
    manifestCrossorigin: 'use-credentials',
  },
};
