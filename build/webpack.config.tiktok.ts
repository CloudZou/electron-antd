import path from 'path'
import { Configuration, WebpackPluginInstance } from 'webpack'

import WebpackBar from 'webpackbar'

import webpackConfigTBase from './webpack.config.tbase'
import buildConfig from './config'

const { dist, tiktokSource: appPath } = buildConfig
const nodeExternals = require('webpack-node-externals')

const webpackConfig: Configuration = {
  ...webpackConfigTBase,
  target: 'node16.20',

  entry: {
    main: path.join(appPath, 'index.ts'),
  },

  output: {
    path: path.join(dist, 'tiktok'),
    filename: '[name].js',
    chunkFilename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /(?<!\.d)\.ts$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  externals: [nodeExternals()],

  plugins: [
    ...(webpackConfigTBase?.plugins ?? []),
    new WebpackBar({ name: 'TikTok    ', color: '#eec690' }),
  ] as WebpackPluginInstance[],
}

export default webpackConfig
