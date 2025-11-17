const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Disable minification to prevent variable hoisting issues
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    ...config.transformer.minifierConfig,
    ecma: 8,
    keep_classnames: true,
    keep_fnames: true,
    compress: {
      ...config.transformer.minifierConfig?.compress,
      drop_console: false,
      pure_getters: false,
      keep_fargs: true,
      keep_fnames: true,
      keep_classnames: true,
      // Prevent variable mangling that causes hoisting issues
      sequences: false,
      join_vars: false,
      collapse_vars: false,
    },
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
    output: {
      comments: false,
      beautify: false,
    },
  },
};

module.exports = config;
