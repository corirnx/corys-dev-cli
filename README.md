# corys-dev-cli (`corys-dev`)

> Personal multi-agent CLI tool for automated repository maintenance, security auditing, dependency/model checks, and code refactoring.

`corys-dev` is an interactive Node.js/TypeScript developer CLI designed to audit and modernize local codebases. Powered by specialized AI subagents and Model Context Protocol (MCP) tool orchestration, it scans your projects for security vulnerabilities, checks LLM integrations against live model specifications from [models.dev](https://models.dev/models.json), and proposes code-quality refactoring—complete with an interactive unified diff review engine and Git safety guards.

---

## Features

- **🔐 Security Subagent:** Scans for hardcoded secrets, API keys, credentials, and high-severity vulnerability patterns in codebase files and lockfiles.
- **📦 Dependency & Model Audit Subagent:** Connects via MCP stdio to `models.dev` to audit active LLM model IDs, context windows, and feature deprecations.
- **🛠 Refactoring Subagent:** Analyzes code quality, unhandled errors, and legacy patterns to generate automated rewrite proposals.
- **🎨 Interactive Diff Engine:** Renders colored unified terminal diffs (`+ green` / `- red`) with options to apply changes, create an isolated Git feature branch, or skip proposals.
- **📄 Structured Audit Reports:** Export audit summaries, security findings, model deprecation notices, and refactoring proposals to persistent files in **Markdown**, **JSON**, or **HTML** via `--format` / `--output`.
- **🛡 Git Safety Pre-Check:** Automatically detects uncommitted changes before agents run, offering to `git stash` work or abort to prevent accidental overwrites.
- **🙈 Ignore Rules (`.corysignore`):** Fine-grained control over which paths the subagents' tools touch. Rules from `.gitignore` and `.corysignore` are honored automatically, and a default `.corysignore` template is created in each target repo.
- **🔌 Multi-Provider Support:** Fully customizable via `.env` to work with OpenRouter, Anthropic, Google Vertex AI, or local LLM proxies (LiteLLM/Ollama).

---

## Architecture Overview

```text
               ┌─────────────────────────────────────────┐
               │              corys-dev CLI              │
               └────────────────────┬────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │     Git Safety Guard  │
                        └───────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │    Security     │    │ Dependency/Model│    │   Refactoring   │
    │    Subagent     │    │  Audit Subagent │    │     Subagent    │
    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
             │                      │                      │
             │                      ▼                      │
             │             ┌─────────────────┐             │
             │             │   models.dev    │             │
             │             │   MCP Server    │             │
             │             └─────────────────┘             │
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │ Interactive Diff Engine │
                       └─────────────────────────┘
```


## Installation

> 👉 Installing the CLI correctly matters: the steps below link the compiled `corys-dev` binary so you can run it from anywhere. You only need to repeat the *last* step after pulling updates.

### Prerequisites
- Node.js: >=18.0.0
- Git installed and available in PATH.

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/corys-dev-cli.git](https://github.com/your-username/corys-dev-cli.git)
cd corys-dev-cli
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the TypeScript output
```bash
npm run build
```
Compiles the source `src/` into `dist/` and makes `dist/index.js` executable.

### 4. Link the binary globally (`npm link`)
```bash
npm link
```
This symlinks `corys-dev` into your global `node_modules/.bin/` so the command is available in any terminal.

### 5. Verify
```bash
corys-dev --help
```

### Updating to a newer version
Pull the latest changes and rebuild — the global link persists, so no re-link is needed:

```bash
git pull
npm run build
```

> **Note on `npm link`:** it only needs to be re-run if the global symlink breaks (e.g. the repo folder was moved/renamed, `node_modules` was deleted, or `npm install` was re-run and removed the link). You do **not** need to link again just because the code changed.

## Configuration
corys-dev-cli supports seamless provider mapping via environment variables. Create a .env file in your repository or global execution environment:

```
# Provider Discriminator: openrouter | anthropic | vertexai | custom
PROVIDER_NAME=openrouter

# Endpoint & Key Config
MODEL_PROVIDER_URL=https://openrouter.ai/api/v1
MODEL_PROVIDER_KEY=sk-or-v1-your-openrouter-api-key
MODEL_NAME=anthropic/claude-sonnet-4
```

## Ignore Rules (`.corysignore`)
Control which paths the subagents (and their `Grep`/`Glob`/`Read` tools) touch. Ignore rules follow `.gitignore` syntax and are layered from three sources:

1. **Built-in defaults** — always excluded: `node_modules/`, `dist/`, `build/`, `.git/`, `coverage/`, minified assets, and common lockfiles.
2. **`.gitignore`** — read from the target repository when present.
3. **`.corysignore`** — optional per-repository override/supplement.

When you run `corys-dev check` against a repo without a `.corysignore`, a commented template is created automatically so you have an obvious place for fine-grained rules (skipped in `--dry-run`). Add entries exactly as you would in `.gitignore`:

```text
# .corysignore
docs/            # skip the whole docs folder
src/generated/   # skip generated code
*.snap           # skip snapshot files
```

Because `.gitignore`, `.corysignore`, and the built-in defaults are combined, you only list rules **beyond** what `.gitignore` already excludes. Layered ignore rules are applied to the Agent SDK's tool calls for the duration of each audit, so secrets or legacy code in ignored paths won't be flagged or rewritten.

## Usage
### Run All Maintenance Checks
Run all subagents against the current working directory: `corys-dev check`

### Run Specific Subagents
Target individual audit modules using `--subagents`:
```bash
# Run only security scan
corys-dev check --subagents security

# Run security and dependency audit together
corys-dev check --subagents security deps

# Run refactoring agent on a target subdirectory
corys-dev check ./src --subagents refactor
```

### CLI Flags & Options
```
Usage: corys-dev check [options] [path]

Run Corys-Dev maintenance subagents on a specified target repository

Arguments:
  path                        Target repository directory path (default: ".")

Options:
  -s, --subagents <types...>  Specify subagents to execute (security, deps, refactor, all) (default: ["all"])
  -v, --verbose               Enable verbose debug logging (default: false)
  -d, --dry-run               Preview subagent analysis without modifying files (default: false)
  -y, --auto-approve          Automatically apply suggested edits without prompting (default: false)
  -o, --offline               Run heuristic audits without calling the Agent SDK (default: false)
  -f, --format <format>       Export audit report as markdown, json, or html (default: "")
  --output <filePath>         File path to write the audit report to (default: "")
  -h, --help                  Display help for command

```

### Exporting Audit Reports
Persist audit results — security findings, model deprecation notices, and refactoring proposals — to a report file. Use `--format` to pick `markdown`, `json`, or `html`, and `--output` to set the file path (parent folders are created automatically).

Reports are generated **only** when you pass `--format`, `--output`, or both:

```bash
# Markdown report (default filename: corys-audit-report.md in cwd)
corys-dev check --format markdown

# JSON to a specific file
corys-dev check --subagents security deps --format json --output reports/audit.json

# Self-contained HTML report in a subfolder
corys-dev check --format html --output reports/audit.html

# Default to markdown if only --output is given
corys-dev check --output audit.md
```

Each report includes the generated timestamp and per-subagent status (passed / findings / failed), plus the full summaries, security findings, model deprecation notices, and rewrite proposals for the subagents you ran.

## Development Workflow
When modifying or extending corys-dev-cli:

```bash
# Run in development mode using tsx
npm run dev -- check --subagents security

# Build TypeScript to dist/
npm run build

# Run TypeScript build (used before publish; does not relink)
npm run prepublishOnly
```

---

License
MIT © Corinna Rohr