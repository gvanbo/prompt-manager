# AI Prompt Manager

Create, manage, and optimize AI prompts in VS Code with history, ratings, and tips.

![Banner](images/banner.png)

## Features

| Feature | Details |
|---|---|
| Structured Prompt Creation | Guided flow to capture context, goals, and formatting |
| Prompt History | Local history with ratings and quick reuse |
| Optimization Tips | Suggestions to improve clarity, context, and constraints |
| Quick Access | Command palette, keyboard shortcut, and editor context menu |

## Screenshots

> Replace these with real screenshots from your extension.

![Create Prompt](images/screenshot-create.png)
![History](images/screenshot-history.png)

## Commands

| Command ID | Title | Shortcut |
|---|---|---|
| `promptManager.createPrompt` | Create Structured Prompt | `Ctrl+Alt+P` (Windows/Linux), `Cmd+Alt+P` (macOS) |
| `promptManager.viewHistory` | View Prompt History | — |
| `promptManager.ratePrompt` | Rate Last Prompt | — |
| `promptManager.optimizePrompt` | Show Optimization Tips | — |

## Installation

- From Marketplace: search for "AI Prompt Manager" by `gvanbo`.
- From VSIX: in VS Code, Extensions view → … menu → Install from VSIX… and choose `prompt-manager-*.vsix`.

## Usage

1. Run "Create Structured Prompt" to start a new prompt.
2. Provide context, goals, and formatting preferences.
3. Use the generated prompt with your AI tool.
4. Rate the result; revisit history to iterate.

## Development

Prerequisites: Node 18+, VS Code 1.74+.

- Build: `npm run package`
- Watch: `npm run watch`
- Run extension: press F5 in VS Code to launch the Extension Development Host.

## Testing

We use `@vscode/test-electron` + Mocha.

- Run tests: `npm test`

## Release Notes

### 1.0.0

- Structured prompt creation
- Prompt history tracking
- Optimization tips
- Keyboard shortcuts and menu integration

## License

MIT © 2025 gvanbo
