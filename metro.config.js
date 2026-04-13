const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
// const navigationPackageRoot = path.resolve(
//   projectRoot,
//   '../expo-gaode-map/packages/navigation'
// );

const config = getDefaultConfig(projectRoot);

// Only watch the local navigation package instead of the whole monorepo.
// config.watchFolders = [navigationPackageRoot];

config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: true,
  // Prevent Metro from climbing into sibling package node_modules.
  disableHierarchicalLookup: true,
  // Force all dependencies to resolve from the app's own node_modules.
  nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules ?? {}),
    react: path.resolve(projectRoot, 'node_modules/react'),
    'react/jsx-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-runtime'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    expo: path.resolve(projectRoot, 'node_modules/expo'),
    'expo-modules-core': path.resolve(projectRoot, 'node_modules/expo-modules-core'),
  },
};

module.exports = config;
