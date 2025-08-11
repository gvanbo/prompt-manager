//@ts-check
const path = require("path");

/** @type {import('webpack').Configuration} */
const config = {
  target: "node",
  mode: "none",
  entry: "./extension.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".js"],
  },
};

module.exports = config;
