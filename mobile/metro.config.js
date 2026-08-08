const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "..")];
config.resolver.assetExts = [...config.resolver.assetExts, "glb"];

module.exports = config;
