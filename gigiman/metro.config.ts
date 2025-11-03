const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ Fix for react-i18next and other ESM modules
config.resolver.unstable_enablePackageExports = false;


  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
  };


module.exports = config;
