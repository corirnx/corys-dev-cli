# corys-dev-cli (`corys-dev`)

> Personal multi-agent CLI tool for automated repository maintenance, security auditing, dependency/model checks, and code refactoring.

`corys-dev` is an interactive Node.js/TypeScript developer CLI designed to audit and modernize local codebases. Powered by specialized AI subagents and Model Context Protocol (MCP) tool orchestration, it scans your projects for security vulnerabilities, checks LLM integrations against live specifications, and proposes AST-level refactoring—complete with an interactive git diff review engine and safety guards.

---

## Features

- **🔐 Security Subagent:** Scans for hardcoded secrets, API keys, credentials, and high-severity vulnerability patterns in codebase files and lockfiles.
- **📦 Dependency & Model Audit Subagent:** Connects via MCP stdio to `models.dev` to audit active LLM model IDs, context windows, and feature deprecations.
- **🛠 Refactoring Subagent:** Analyzes code quality, unhandled errors, and legacy patterns to generate automated rewrite proposals.
- **🎨 Interactive Diff Engine:** Renders colored, side-by-side terminal diffs (`+ green` / `- red`) with options to apply changes, create an isolated Git feature branch, or skip proposals.
- **🛡 Git Safety Pre-Check:** Automatically detects uncommitted changes before agents run, offering to `git stash` work or abort to prevent accidental overwrites.
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
### Prerequisites
- Node.js: >=18.0.0
- Git installed and available in PATH.

### Global Setup (Local Linking)
Clone and link the binary globally on your machine:
```bash
git clone [https://github.com/your-username/corys-dev-cli.git](https://github.com/your-username/corys-dev-cli.git)
cd corys-dev-cli
npm install
npm run build
npm link
```

Verify installation: `corys-dev --help`

## Configuration
corys-dev-cli supports seamless provider mapping via environment variables. Create a .env file in your repository or global execution environment:

```
# Provider Discriminator: openrouter | anthropic | vertexai | custom
PROVIDER_NAME=openrouter

# Endpoint & Key Config
MODEL_PROVIDER_URL=[https://openrouter.ai/api](https://openrouter.ai/api)
MODEL_PROVIDER_KEY=sk-or-v1-your-openrouter-api-key
MODEL_NAME=deepseek/deepseek-chat
```

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
  -h, --help                  Display help for command

```

## Development Workflow
When modifying or extending corys-dev-cli:

```bash
# Run in development mode using tsx
npm run dev -- check --subagents security

# Build TypeScript to dist/
npm run build

# Run TypeScript build + global relink
npm run prepublishOnly
```

---

License
MIT © Corinna Rohr