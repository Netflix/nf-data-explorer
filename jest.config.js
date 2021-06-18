module.exports = {
  projects: ['./jest-express-app.config.js', './jest-services.config.js'],
  transformIgnorePatterns: ['/node_modules/(?!date-fns)'],
  collectCoverage: false,
  collectCoverageFrom: ['src/server/**/*.{js,ts}', '!src/server/public/**/*'],
};
