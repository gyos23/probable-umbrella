const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Completely disable minification to prevent hoisting errors
// This is required for complex React components with multiple useMemo/useEffect hooks
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    ...config.transformer.minifierConfig,
    ecma: 8,
    keep_classnames: true,
    keep_fnames: true,
    compress: false, // Disable all compression
    mangle: false,   // Disable all mangling
    output: {
      comments: false,
      beautify: true,  // Keep code readable
    },
  },
};

module.exports = config;
