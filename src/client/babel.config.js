module.exports = {
  presets: ['@vue/cli-plugin-babel/preset'],
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    // Exclude 'babel-plugin-component' when running tests
    ...(process.env.NODE_ENV === 'test'
      ? []
      : [
          [
            'component',
            {
              libaryName: 'element-ui',
              style: false,
            },
          ],
        ]),
  ],
};
