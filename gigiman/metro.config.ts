const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ Fix for react-i18next and other ESM modules
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
