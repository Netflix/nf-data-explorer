/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
module.exports = {
  transformIgnorePatterns: ['/node_modules/(?!date-fns)'],
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@sharedtypes(.*)$': path.resolve(__dirname, '../server/typings$1'),
    '@cassandratypes(.*)$': path.resolve(
      __dirname,
      '../server/services/datastores/cassandra/typings/$1',
    ),
  },
};
