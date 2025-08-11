const path = require("path");
const Mocha = require("mocha");
const { globSync } = require("glob");

function run() {
  const mocha = new Mocha({ ui: "tdd", color: true, timeout: 10000 });

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((resolve, reject) => {
    try {
      const files = globSync("**/*.test.js", { cwd: testsRoot });
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { run };
