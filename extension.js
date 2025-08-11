// extension.js - Complete VS Code Prompt Manager Extension
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

class PromptManager {
  constructor(context) {
    this.context = context;
    this.promptHistory = [];
    this.loadHistory();
    this.registerCommands();
  }

  registerCommands() {
    // Register commands
    const createPrompt = vscode.commands.registerCommand(
      "promptManager.createPrompt",
      () => {
        this.showPromptCreator();
      }
    );

    const viewHistory = vscode.commands.registerCommand(
      "promptManager.viewHistory",
      () => {
        this.showPromptHistory();
      }
    );

    const ratePrompt = vscode.commands.registerCommand(
      "promptManager.ratePrompt",
      () => {
        this.showRatingInterface();
      }
    );

    const optimizePrompt = vscode.commands.registerCommand(
      "promptManager.optimizePrompt",
      () => {
        this.showOptimizationSuggestions();
      }
    );

    this.context.subscriptions.push(
      createPrompt,
      viewHistory,
      ratePrompt,
      optimizePrompt
    );
  }

  async showPromptCreator() {
    const panel = vscode.window.createWebviewPanel(
      "promptCreator",
      "Prompt Creator",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getPromptCreatorHTML();

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "createPrompt":
          await this.createStructuredPrompt(message.data);
          break;
        case "getContext":
          const context = await this.getProjectContext();
          panel.webview.postMessage({
            command: "contextLoaded",
            data: context,
          });
          break;
      }
    });
  }

  async getProjectContext() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return {};

    const context = {
      projectName: path.basename(workspaceFolder.uri.fsPath),
      hasPackageJson: fs.existsSync(
        path.join(workspaceFolder.uri.fsPath, "package.json")
      ),
      hasMoodleConfig: fs.existsSync(
        path.join(workspaceFolder.uri.fsPath, "version.php")
      ),
      hasClaudeConfig: fs.existsSync(
        path.join(workspaceFolder.uri.fsPath, ".claude")
      ),
      hasCopilotConfig: fs.existsSync(
        path.join(workspaceFolder.uri.fsPath, "copilot.yml")
      ),
      gitBranch: await this.getCurrentGitBranch(),
      openFiles: vscode.workspace.textDocuments.map((doc) => ({
        fileName: path.basename(doc.fileName),
        language: doc.languageId,
      })),
    };

    return context;
  }

  async getCurrentGitBranch() {
    try {
      const { exec } = require("child_process");
      return new Promise((resolve) => {
        exec(
          "git branch --show-current",
          { cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath },
          (error, stdout) => {
            resolve(error ? "main" : stdout.trim());
          }
        );
      });
    } catch {
      return "main";
    }
  }

  async createStructuredPrompt(data) {
    const timestamp = new Date().toISOString();
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    const prompt = {
      id: Date.now().toString(),
      timestamp,
      context: data.context,
      goal: data.goal,
      currentState: data.currentState,
      constraints: data.constraints,
      expectedOutput: data.expectedOutput,
      modelSuggestion: this.suggestModel(data),
      fullPrompt: this.formatPrompt(data),
      projectPath: workspaceFolder?.uri.fsPath || "",
      rating: null,
      notes: "",
    };

    this.promptHistory.push(prompt);
    this.saveHistory();

    // Copy to clipboard
    await vscode.env.clipboard.writeText(prompt.fullPrompt);

    vscode.window
      .showInformationMessage(
        `Prompt created and copied to clipboard! Suggested model: ${prompt.modelSuggestion}`,
        "View History",
        "Rate Later"
      )
      .then((selection) => {
        if (selection === "View History") {
          this.showPromptHistory();
        }
      });
  }

  suggestModel(data) {
    const context = data.context.toLowerCase();
    const goal = data.goal.toLowerCase();

    // Complex tasks
    if (
      goal.includes("architecture") ||
      goal.includes("refactor") ||
      goal.includes("debug")
    ) {
      return "Claude Sonnet 4";
    }

    // Client work
    if (context.includes("client") || goal.includes("production")) {
      return "Claude Sonnet 4";
    }

    // Moodle specific
    if (
      context.includes("moodle") &&
      (goal.includes("complex") || goal.includes("integration"))
    ) {
      return "Claude Sonnet 4";
    }

    // Simple tasks
    if (
      goal.includes("autocomplete") ||
      goal.includes("boilerplate") ||
      goal.includes("simple")
    ) {
      return "GitHub Copilot";
    }

    // Experimental or quick tasks
    if (
      goal.includes("experimental") ||
      goal.includes("quick") ||
      goal.includes("lookup")
    ) {
      return "Gemini 2.5 Flash";
    }

    return "Claude Sonnet 4"; // Default to premium for quality
  }

  formatPrompt(data) {
    const optimized = this.optimizePromptContent(data);
    return `Context: ${optimized.context}

Goal: ${optimized.goal}

Current State: ${optimized.currentState}

Constraints: ${optimized.constraints}

Expected Output: ${optimized.expectedOutput}`;
  }

  optimizePromptContent(data) {
    return {
      context: this.enhanceContext(data.context),
      goal: this.enhanceGoal(data.goal),
      currentState: this.enhanceCurrentState(data.currentState),
      constraints: this.enhanceConstraints(data.constraints),
      expectedOutput: this.enhanceExpectedOutput(data.expectedOutput),
    };
  }

  enhanceContext(context) {
    if (!context) return context;

    // Add specificity cues
    let enhanced = context;

    // Add project type context if missing
    if (
      !enhanced.toLowerCase().includes("moodle") &&
      !enhanced.toLowerCase().includes("react")
    ) {
      const workspaceContext = this.getWorkspaceTypeHint();
      if (workspaceContext) {
        enhanced = `${workspaceContext}: ${enhanced}`;
      }
    }

    // Suggest adding version/environment info if vague
    if (enhanced.length < 30) {
      enhanced +=
        " (Consider adding: version, environment, specific component)";
    }

    return enhanced;
  }

  enhanceGoal(goal) {
    if (!goal) return goal;

    let enhanced = goal;

    // Make goals more specific
    if (
      enhanced.toLowerCase().includes("fix") &&
      !enhanced.toLowerCase().includes("how")
    ) {
      enhanced = `Identify root cause and provide solution to ${enhanced.toLowerCase()}`;
    }

    if (enhanced.toLowerCase().includes("create") && enhanced.length < 50) {
      enhanced += " with step-by-step implementation details";
    }

    // Add success criteria prompt
    if (
      !enhanced.toLowerCase().includes("success") &&
      !enhanced.toLowerCase().includes("criteria")
    ) {
      enhanced += ". Include clear success criteria for completion";
    }

    return enhanced;
  }

  enhanceCurrentState(currentState) {
    if (!currentState) return currentState;

    let enhanced = currentState;

    // Prompt for code/error details if missing
    if (enhanced.length < 40) {
      enhanced +=
        "\n\n[Consider adding: relevant code snippets, error messages, current behavior vs expected behavior]";
    }

    // Suggest file structure if architectural
    if (
      enhanced.toLowerCase().includes("file") ||
      enhanced.toLowerCase().includes("structure")
    ) {
      enhanced += "\n[Tip: Include file tree or relevant file paths]";
    }

    return enhanced;
  }

  enhanceConstraints(constraints) {
    if (!constraints) return "Follow best practices and maintain code quality";

    let enhanced = constraints;

    // Add standard constraints if missing
    const commonConstraints = [];

    if (!enhanced.toLowerCase().includes("standard")) {
      const projectType = this.getWorkspaceTypeHint();
      if (projectType === "Moodle") {
        commonConstraints.push("Follow Moodle coding standards");
      } else if (projectType === "React") {
        commonConstraints.push(
          "Use React best practices and accessibility standards"
        );
      }
    }

    if (
      !enhanced.toLowerCase().includes("backward") &&
      !enhanced.toLowerCase().includes("breaking")
    ) {
      commonConstraints.push("No breaking changes to existing functionality");
    }

    if (!enhanced.toLowerCase().includes("performance")) {
      commonConstraints.push("Consider performance implications");
    }

    if (commonConstraints.length > 0) {
      enhanced += (enhanced ? ". " : "") + commonConstraints.join(". ");
    }

    return enhanced;
  }

  enhanceExpectedOutput(expectedOutput) {
    if (!expectedOutput)
      return "Complete solution with code examples and implementation steps";

    let enhanced = expectedOutput;

    // Make output expectations more specific
    if (enhanced.length < 30) {
      enhanced +=
        ". Include: code examples, step-by-step instructions, and explanation of approach";
    }

    // Add testing/validation suggestions
    if (
      !enhanced.toLowerCase().includes("test") &&
      !enhanced.toLowerCase().includes("verify")
    ) {
      enhanced += ". Suggest how to test/verify the solution";
    }

    // Add documentation hints for complex tasks
    if (
      enhanced.toLowerCase().includes("architecture") ||
      enhanced.toLowerCase().includes("refactor")
    ) {
      enhanced += ". Include documentation for future maintenance";
    }

    return enhanced;
  }

  getWorkspaceTypeHint() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;

    const basePath = workspaceFolder.uri.fsPath;
    if (fs.existsSync(path.join(basePath, "version.php"))) return "Moodle";
    if (fs.existsSync(path.join(basePath, "package.json")))
      return "React/Node.js";
    return null;
  }

  showPromptHistory() {
    const panel = vscode.window.createWebviewPanel(
      "promptHistory",
      "Prompt History & Analytics",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getHistoryHTML();

    panel.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "ratePrompt":
          this.ratePrompt(message.promptId, message.rating);
          break;
        case "deletePrompt":
          this.deletePrompt(message.promptId);
          panel.webview.html = this.getHistoryHTML();
          break;
      }
    });
  }

  async showRatingInterface() {
    if (this.promptHistory.length === 0) {
      vscode.window.showWarningMessage("No prompts to rate");
      return;
    }

    const unratedPrompts = this.promptHistory.filter((p) => !p.rating);
    if (unratedPrompts.length === 0) {
      vscode.window.showInformationMessage("All prompts are already rated");
      return;
    }

    const latest = unratedPrompts[unratedPrompts.length - 1];
    const shortGoal =
      latest.goal.substring(0, 50) + (latest.goal.length > 50 ? "..." : "");

    const efficiency = await vscode.window.showInputBox({
      prompt: `Rate Efficiency (1-5) for: "${shortGoal}"`,
      validateInput: (value) => {
        const num = parseInt(value);
        return num >= 1 && num <= 5 ? null : "Please enter 1-5";
      },
    });

    if (!efficiency) return;

    const accuracy = await vscode.window.showInputBox({
      prompt: "Rate Accuracy (1-5)",
      validateInput: (value) => {
        const num = parseInt(value);
        return num >= 1 && num <= 5 ? null : "Please enter 1-5";
      },
    });

    if (!accuracy) return;

    const satisfaction = await vscode.window.showInputBox({
      prompt: "Rate Satisfaction (1-5)",
      validateInput: (value) => {
        const num = parseInt(value);
        return num >= 1 && num <= 5 ? null : "Please enter 1-5";
      },
    });

    if (!satisfaction) return;

    const notes = await vscode.window.showInputBox({
      prompt: "Additional notes (optional)",
      placeHolder: "What worked well or could be improved?",
    });

    this.ratePrompt(latest.id, {
      efficiency: parseInt(efficiency),
      accuracy: parseInt(accuracy),
      satisfaction: parseInt(satisfaction),
      notes: notes || "",
    });
  }

  ratePrompt(promptId, rating) {
    const prompt = this.promptHistory.find((p) => p.id === promptId);
    if (prompt) {
      prompt.rating = rating;
      prompt.notes = rating.notes;
      this.saveHistory();
      vscode.window.showInformationMessage("Prompt rating saved!");
    }
  }

  deletePrompt(promptId) {
    this.promptHistory = this.promptHistory.filter((p) => p.id !== promptId);
    this.saveHistory();
  }

  showOptimizationSuggestions() {
    const analytics = this.getAnalytics();
    const suggestions = this.generateOptimizationSuggestions(analytics);

    vscode.window.showInformationMessage(suggestions, { modal: true });
  }

  getAnalytics() {
    const rated = this.promptHistory.filter((p) => p.rating);

    return {
      totalPrompts: this.promptHistory.length,
      ratedPrompts: rated.length,
      avgEfficiency: this.calculateAverage(rated, "efficiency"),
      avgAccuracy: this.calculateAverage(rated, "accuracy"),
      avgSatisfaction: this.calculateAverage(rated, "satisfaction"),
      modelUsage: this.getModelUsageStats(),
      topPerformingPrompts: rated
        .sort(
          (a, b) =>
            (b.rating.efficiency + b.rating.accuracy + b.rating.satisfaction) /
              3 -
            (a.rating.efficiency + a.rating.accuracy + a.rating.satisfaction) /
              3
        )
        .slice(0, 5),
    };
  }

  calculateAverage(prompts, field) {
    if (prompts.length === 0) return 0;
    return (
      prompts.reduce((sum, p) => sum + (p.rating[field] || 0), 0) /
      prompts.length
    );
  }

  getModelUsageStats() {
    const usage = {};
    this.promptHistory.forEach((p) => {
      usage[p.modelSuggestion] = (usage[p.modelSuggestion] || 0) + 1;
    });
    return usage;
  }

  generateOptimizationSuggestions(analytics) {
    let suggestions = "Optimization Suggestions:\n\n";

    if (analytics.avgEfficiency < 3) {
      suggestions += "• Consider using more specific context and constraints\n";
    }

    if (analytics.avgAccuracy < 3) {
      suggestions += "• Include more detailed current state information\n";
    }

    if (analytics.avgSatisfaction < 3) {
      suggestions += "• Be more explicit about expected output format\n";
    }

    if (analytics.ratedPrompts < analytics.totalPrompts * 0.5) {
      suggestions +=
        "• Rate more prompts to get better optimization insights\n";
    }

    return suggestions;
  }

  loadHistory() {
    try {
      const historyPath = path.join(
        this.context.globalStorageUri.fsPath,
        "prompt-history.json"
      );
      if (fs.existsSync(historyPath)) {
        this.promptHistory = JSON.parse(fs.readFileSync(historyPath, "utf8"));
      }
    } catch (error) {
      console.error("Failed to load prompt history:", error);
    }
  }

  saveHistory() {
    try {
      const historyPath = path.join(
        this.context.globalStorageUri.fsPath,
        "prompt-history.json"
      );
      fs.mkdirSync(path.dirname(historyPath), { recursive: true });
      fs.writeFileSync(
        historyPath,
        JSON.stringify(this.promptHistory, null, 2)
      );
    } catch (error) {
      console.error("Failed to save prompt history:", error);
    }
  }

  getPromptCreatorHTML() {
    return `<!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; color: var(--vscode-editor-foreground); }
                input, textarea, select { 
                    width: 100%; 
                    padding: 8px; 
                    border: 1px solid var(--vscode-input-border); 
                    border-radius: 4px; 
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: inherit;
                }
                textarea { min-height: 80px; resize: vertical; }
                button { 
                    background: var(--vscode-button-background); 
                    color: var(--vscode-button-foreground); 
                    padding: 10px 20px; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-family: inherit;
                }
                button:hover { background: var(--vscode-button-hoverBackground); }
                .context-info { 
                    background: var(--vscode-textBlockQuote-background); 
                    border: 1px solid var(--vscode-textBlockQuote-border);
                    padding: 10px; 
                    border-radius: 4px; 
                    margin-bottom: 15px;
                    font-size: 0.9em;
                    min-height: 20px;
                }
                .context-info.loading { 
                    opacity: 0.7; 
                    font-style: italic; 
                }
                .model-suggestion { 
                    background: var(--vscode-editorInfo-background); 
                    border: 1px solid var(--vscode-editorInfo-border);
                    padding: 10px; 
                    border-radius: 4px; 
                    margin-top: 10px; 
                }
                h2 { color: var(--vscode-editor-foreground); margin-top: 0; }
            </style>
        </head>
        <body>
            <h2>Create Structured Prompt</h2>
            <div class="context-info loading" id="contextInfo">Loading project context...</div>
            
            <form id="promptForm">
                <div class="form-group">
                    <label for="context">Context:</label>
                    <textarea id="context" placeholder="Brief project context, current working area, relevant technologies"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="goal">Goal:</label>
                    <textarea id="goal" placeholder="What you want to achieve - be specific"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="currentState">Current State:</label>
                    <textarea id="currentState" placeholder="Relevant code/files, error messages, current behavior"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="constraints">Constraints:</label>
                    <textarea id="constraints" placeholder="Requirements, limitations, standards to follow"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="expectedOutput">Expected Output:</label>
                    <textarea id="expectedOutput" placeholder="Specific deliverable format, success criteria"></textarea>
                </div>
                
                <button type="submit">Create Prompt</button>
            </form>
            
            <div class="model-suggestion" id="modelSuggestion" style="display: none;"></div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                // Load context on page load
                window.addEventListener('load', () => {
                    vscode.postMessage({ command: 'getContext' });
                });
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'contextLoaded') {
                        displayContext(message.data);
                    }
                });
                
                function displayContext(context) {
                    const info = document.getElementById('contextInfo');
                    info.classList.remove('loading');
                    
                    if (!context.projectName) {
                        info.innerHTML = '<strong>No workspace detected</strong> - Open a project folder for enhanced context';
                        return;
                    }
                    
                    let html = '<strong>📁 Project Context:</strong><br>';
                    html += \`<strong>Project:</strong> \${context.projectName}<br>\`;
                    html += \`<strong>Branch:</strong> \${context.gitBranch}<br>\`;
                    html += \`<strong>Type:</strong> \${getProjectType(context)}<br>\`;
                    
                    if (context.openFiles && context.openFiles.length > 0) {
                        const fileList = context.openFiles.slice(0, 3).map(f => f.fileName).join(', ');
                        const remaining = context.openFiles.length > 3 ? \` (+\${context.openFiles.length - 3} more)\` : '';
                        html += \`<strong>Open Files:</strong> \${fileList}\${remaining}\`;
                    } else {
                        html += '<strong>Open Files:</strong> None';
                    }
                    
                    info.innerHTML = html;
                }
                
                function getProjectType(context) {
                    if (context.hasMoodleConfig) return '🎓 Moodle Plugin';
                    if (context.hasPackageJson) return '⚛️ Node.js/React';
                    if (context.hasClaudeConfig) return '🤖 AI-Enhanced Project';
                    return '📂 General Project';
                }
                
                document.getElementById('promptForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const data = {
                        context: document.getElementById('context').value,
                        goal: document.getElementById('goal').value,
                        currentState: document.getElementById('currentState').value,
                        constraints: document.getElementById('constraints').value,
                        expectedOutput: document.getElementById('expectedOutput').value
                    };
                    
                    vscode.postMessage({ command: 'createPrompt', data });
                });
            </script>
        </body>
        </html>`;
  }

  getHistoryHTML() {
    const analytics = this.getAnalytics();

    return `<!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                .analytics { background: #f5f5f5; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
                .prompt-item { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 10px; }
                .prompt-header { font-weight: bold; margin-bottom: 10px; }
                .rating { margin-top: 10px; }
                .rating button { margin-right: 5px; padding: 5px 10px; }
                .rating.rated { background: #e8f4fd; }
                button { background: #007ACC; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; }
                button.delete { background: #d32f2f; }
                .model-tag { background: #007ACC; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
            </style>
        </head>
        <body>
            <h2>Prompt History & Analytics</h2>
            
            <div class="analytics">
                <h3>Analytics</h3>
                <p><strong>Total Prompts:</strong> ${analytics.totalPrompts}</p>
                <p><strong>Rated:</strong> ${analytics.ratedPrompts}/${
      analytics.totalPrompts
    }</p>
                <p><strong>Avg Efficiency:</strong> ${analytics.avgEfficiency.toFixed(
                  1
                )}/5</p>
                <p><strong>Avg Accuracy:</strong> ${analytics.avgAccuracy.toFixed(
                  1
                )}/5</p>
                <p><strong>Avg Satisfaction:</strong> ${analytics.avgSatisfaction.toFixed(
                  1
                )}/5</p>
            </div>
            
            <div class="prompts">
                ${this.promptHistory
                  .map(
                    (prompt) => `
                    <div class="prompt-item">
                        <div class="prompt-header">
                            ${new Date(prompt.timestamp).toLocaleString()}
                            <span class="model-tag">${
                              prompt.modelSuggestion
                            }</span>
                        </div>
                        <p><strong>Goal:</strong> ${prompt.goal}</p>
                        <p><strong>Context:</strong> ${prompt.context}</p>
                        
                        <div class="rating ${prompt.rating ? "rated" : ""}">
                            ${
                              prompt.rating
                                ? `<p>Efficiency: ${prompt.rating.efficiency}/5, Accuracy: ${prompt.rating.accuracy}/5, Satisfaction: ${prompt.rating.satisfaction}/5</p>`
                                : `<button onclick="ratePrompt('${prompt.id}')">Rate Prompt</button>`
                            }
                            <button class="delete" onclick="deletePrompt('${
                              prompt.id
                            }')">Delete</button>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function ratePrompt(promptId) {
                    const efficiency = prompt('Rate Efficiency (1-5):');
                    const accuracy = prompt('Rate Accuracy (1-5):');
                    const satisfaction = prompt('Rate Satisfaction (1-5):');
                    const notes = prompt('Additional notes (optional):') || '';
                    
                    if (efficiency && accuracy && satisfaction) {
                        vscode.postMessage({
                            command: 'ratePrompt',
                            promptId,
                            rating: {
                                efficiency: parseInt(efficiency),
                                accuracy: parseInt(accuracy),
                                satisfaction: parseInt(satisfaction),
                                notes
                            }
                        });
                        location.reload();
                    }
                }
                
                function deletePrompt(promptId) {
                    if (confirm('Delete this prompt?')) {
                        vscode.postMessage({ command: 'deletePrompt', promptId });
                    }
                }
            </script>
        </body>
        </html>`;
  }
}

function activate(context) {
  new PromptManager(context);
}

function deactivate() {}

module.exports = { activate, deactivate };