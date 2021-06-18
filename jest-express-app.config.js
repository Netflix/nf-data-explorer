module.exports = {
  displayName: 'express-app',
  roots: ['<rootDir>/src/server'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/(config|model|routes)(/.*)?)(/__tests__/.*spec).ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/server/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup-express.ts'],
  coveragePathIgnorePatterns: ['.*\\/__tests__\\/.*'],
};
