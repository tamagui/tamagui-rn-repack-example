const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const ReactNative = require('@callstack/repack')

const mode = ReactNative.getMode({ fallback: 'development' })
const dev = mode === 'development'
const context = ReactNative.getContext()
const entry = ReactNative.getEntry()
const platform = ReactNative.getPlatform({ fallback: process.env.PLATFORM })
const minimize = ReactNative.isMinimizeEnabled({ fallback: !dev })
const devServer = ReactNative.getDevServerOptions()
const reactNativePath = ReactNative.getReactNativePath()

process.env.BABEL_ENV = mode

module.exports = {
  mode,
  /**
   * This should be always `false`, since the Source Map configuration is done
   * by `SourceMapDevToolPlugin`.
   */
  devtool: false,
  context,
  /**
   * `getInitializationEntries` will return necessary entries with setup and initialization code.
   * If you don't want to use Hot Module Replacement, set `hmr` option to `false`. By default,
   * HMR will be enabled in development mode.
   */
  entry: [
    ...ReactNative.getInitializationEntries(reactNativePath, {
      hmr: devServer.hmr,
    }),
    entry,
  ],
  resolve: {
    /**
     *  `<file>.<platform>.<ext>`
     */
    ...ReactNative.getResolveOptions(platform),

    /**
     * Uncomment this to ensure all `react-native*` imports will resolve to the same React Native
     * dependency. You might need it when using workspaces/monorepos or unconventional project
     * structure. For simple/typical project you won't need it.
     */
    alias: {
      'react-native': reactNativePath,
      '@unimodules/core': require.resolve('@unimodules/core'),
      react: require.resolve('react'),
    },
  },

  output: {
    clean: true,
    path: path.join(__dirname, 'build', platform),
    filename: 'index.bundle',
    chunkFilename: '[name].chunk.bundle',
    publicPath: ReactNative.getPublicPath(devServer),
  },

  optimization: {
    minimize,
    minimizer: [
      new TerserPlugin({
        test: /\.(js)?bundle(\?.*)?$/i,
        extractComments: false,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        include: [
          /node_modules(.*[/\\])+react/,
          /node_modules(.*[/\\])+@react-native/,
          /node_modules(.*[/\\])+@react-navigation/,
          /node_modules(.*[/\\])+@react-native-community/,
          /node_modules(.*[/\\])+@expo/,
          /node_modules(.*[/\\])+pretty-format/,
          /node_modules(.*[/\\])+metro/,
          /node_modules(.*[/\\])+abort-controller/,
          /node_modules(.*[/\\])+@callstack[/\\]repack/,
        ],
        use: 'babel-loader',
      },

      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            /** Add React Refresh transform only when HMR is enabled. */
            plugins: devServer.hmr ? ['module:react-refresh/babel'] : undefined,
          },
        },
      },

      {
        test: ReactNative.getAssetExtensionsRegExp(ReactNative.ASSET_EXTENSIONS),
        use: {
          loader: '@callstack/repack/assets-loader',
          options: {
            platform,
            devServerEnabled: devServer.enabled,
            /**
             * Defines which assets are scalable - which assets can have
             * scale suffixes: `@1x`, `@2x` and so on.
             * By default all images are scalable.
             */
            scalableAssetExtensions: ReactNative.SCALABLE_ASSETS,
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(dev),
      TAMAGUI_TARGET: '"native"',
    }),

    /**
     * This plugin makes sure the resolution for assets like images works with scales,
     * for example: `image@1x.png`, `image@2x.png`.
     */
    new ReactNative.AssetsResolverPlugin({
      platform,
    }),

    /**
     * React Native environment (globals and APIs that are available inside JS) differ greatly
     * from Web or Node.js. This plugin ensures everything is setup correctly so that features
     * like Hot Module Replacement will work correctly.
     */
    new ReactNative.TargetPlugin(),

    /**
     * By default Webpack will emit files into `output.path` directory (eg: `<root>/build/ios`),
     * but in order to for the React Native application to include those files (or a subset of those)
     * they need to be copied over to correct output directories supplied from React Native CLI
     * when bundling the code (with `webpack-bundle` command).
     * All remote chunks will be placed under `remoteChunksOutput` directory (eg: `<root>/build/<platform>/remote` by default).
     * In development mode (when development server is running), this plugin is a no-op.
     */
    new ReactNative.OutputPlugin({
      platform,
      devServerEnabled: devServer.enabled,
      remoteChunksOutput: path.join(__dirname, 'build', platform, 'remote'),
    }),

    /**
     * Runs development server when running with React Native CLI start command or if `devServer`
     * was provided as s `fallback`.
     */
    new ReactNative.DevServerPlugin({
      platform,
      ...devServer,
    }),

    /**
     * Configures Source Maps for the main bundle based on CLI options received from
     * React Native CLI or fallback value..
     * It's recommended to leave the default values, unless you know what you're doing.
     * Wrong options might cause symbolication of stack trace inside React Native app
     * to fail - the app will still work, but you might not get Source Map support.
     */
    new webpack.SourceMapDevToolPlugin({
      test: /\.(js)?bundle$/,
      exclude: /\.chunk\.(js)?bundle$/,
      filename: '[file].map',
      append: `//# sourceMappingURL=[url]?platform=${platform}`,
      /**
       * Uncomment for faster builds but less accurate Source Maps
       */
      // columns: false,
    }),

    /**
     * Configures Source Maps for any additional chunks.
     * It's recommended to leave the default values, unless you know what you're doing.
     * Wrong options might cause symbolication of stack trace inside React Native app
     * to fail - the app will still work, but you might not get Source Map support.
     */
    new webpack.SourceMapDevToolPlugin({
      test: /\.(js)?bundle$/,
      include: /\.chunk\.(js)?bundle$/,
      filename: '[file].map',
      append: `//# sourceMappingURL=[url]?platform=${platform}`,
      /**
       * Uncomment for faster builds but less accurate Source Maps
       */
      // columns: false,
    }),

    /**
     * Logs messages and progress.
     * It's recommended to always have this plugin, otherwise it might be difficult
     * to figure out what's going on when bundling or running development server.
     */
    new ReactNative.LoggerPlugin({
      platform,
      devServerEnabled: devServer.enabled,
      output: {
        console: true,
        /**
         * Uncomment for having logs stored in a file to this specific compilation.
         * Compilation for each platform gets it's own log file.
         */
        // file: path.join(__dirname, `${mode}.${platform}.log`),
      },
    }),
  ],
}
