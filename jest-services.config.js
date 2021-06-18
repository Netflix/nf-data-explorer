module.exports = {
  displayName: 'services',
  roots: ['<rootDir>/src/server'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex:
    '(/(i18n|services|utils)/.*)(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/server/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup-services.ts'],
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['.*\\/__tests__\\/.*'],
};
