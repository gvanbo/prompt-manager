const path = require("path");
const fs = require("fs");
const { runTests } = require("@vscode/test-electron");

async function main() {
  try {
    // Ensure tests do not inherit VS Code portable mode or other env that
    // overrides user data directories and causes mutex conflicts on Windows.
    delete process.env.VSCODE_PORTABLE;
    delete process.env.VSCODE_APPDATA;
    delete process.env.APPDATA; // not strictly needed, but helps isolation in CI

    const extensionDevelopmentPath = path.resolve(__dirname, "..");
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    const testRoot = path.resolve(__dirname, "..", ".vscode-test");
    const runId = Date.now().toString();
    const userDataDir = path.join(testRoot, "user-data", runId);
    const extensionsDir = path.join(testRoot, "extensions", runId);
    [testRoot, userDataDir, extensionsDir].forEach((p) => {
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        `--user-data-dir=${userDataDir}`,
        `--extensions-dir=${extensionsDir}`,
        "--disable-updates",
        "--disable-extensions",
        "--skip-welcome",
        "--skip-release-notes",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-workspace-trust",
        "--no-cached-data",
      ],
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
