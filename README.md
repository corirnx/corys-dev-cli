# corys-dev-cli (`corys-dev`)

> Personal multi-agent CLI tool for automated repository maintenance, security auditing, dependency/model checks, and code refactoring.

`corys-dev` is an interactive Node.js/TypeScript CLI that audits and modernizes local codebases via specialized AI subagents, live [models.dev](https://models.dev/models.json) lookups, and MCP tool orchestration.

---

## Features

- **🔐 Security Subagent:** Scans for hardcoded secrets, API keys, credentials, and high-severity vulnerability patterns in codebase files and lockfiles.
- **📦 Dependency & Model Audit Subagent:** Connects via MCP stdio to `models.dev` to audit active LLM model IDs, context windows, and feature deprecations.
- **🛠 Refactoring Subagent:** Analyzes code quality, unhandled errors, and legacy patterns to generate automated rewrite proposals.
- **🎨 Interactive Diff Engine:** Renders colored unified terminal diffs (`+ green` / `- red`) with options to apply changes, create an isolated Git feature branch, or skip proposals.
- **📄 Structured Audit Reports:** Export audit summaries, security findings, model deprecation notices, and refactoring proposals to persistent files in **Markdown**, **JSON**, or **HTML** via `--format` / `--output`. Reports include run metadata (target, git branch/commit, mode, durations), severity-tagged findings, a per-subagent **risk assessment**, and inline diff previews for rewrite proposals.
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

### Prerequisites
- Node.js: >=18.0.0
- Git installed and available in PATH.

### Steps
```bash
git clone [https://github.com/your-username/corys-dev-cli.git](https://github.com/your-username/corys-dev-cli.git)
cd corys-dev-cli
npm install
npm run build   # compiles src/ into dist/ and makes dist/index.js executable
npm link        # adds the global corys-dev command
```

Verify installation: `corys-dev --help`

### Updating
After pulling changes, just rebuild — the `npm link` symlink persists:
```bash
git pull
npm run build
```
Re-run `npm link` only if the link breaks (repo folder moved/renamed, `node_modules` deleted, or `npm install` cleared it). Code changes never require re-linking.

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
  -d, --dry-run               Preview subagent analysis without modifying files (default: false)
  -y, --auto-approve          Automatically apply suggested edits without prompting (default: false)
  -o, --offline               Run heuristic audits without calling the Agent SDK (default: false)
  -f, --format <format>       Export audit report as markdown, json, or html (default: "")
  --output <filePath>         File path to write the audit report to (default: "")
  -h, --help                  Display help for command

```

### Exporting Audit Reports
Persist audit results — security findings, model deprecation notices, and refactoring proposals — to a file. Reports are generated **only** when you pass `--format`, `--output`, or both:

```bash
# Markdown (default filename corys-audit-report.md in cwd)
corys-dev check --format markdown

# JSON to a specific file (parent folders are created automatically)
corys-dev check --subagents security deps --format json --output reports/audit.json
```

Each format serves a different use:

| Format | Best for |
|--------|----------|
| `markdown` | Human-readable summary of all results |
| `json` | Machine-readable metrics & structured findings (CI pipelines) |
| `html` | A styled, self-contained report openable in a browser |

Each report includes run metadata (target path, git branch/commit, subagents run, offline/dry-run mode, per-subagent duration) plus, per subagent, its status, summary, **risk assessment**, severity-tagged **findings** (with type, severity, and location), and rewrite proposals. To add it to your `.gitignore`/`.corysignore` or commit it, simply keep the generated file.

Here is an example of what a Markdown report section looks like:

```text
### Security Agent
**Status:** `findings_found`
**Summary:**
Found 4 security concern(s).

**Risk assessment:** Low-risk posture: no urgent action required. Found 4 finding(s) (0 high, 0 medium, 4 low) across 1 category(ies).

#### Findings (4)

**By type:** dependency (4)
**By severity:** low (4)

- **[low]** `dependency` `package.json`: Suspicious dependency name: @anthropic-ai/claude-agent-sdk
```

Reports are generated **only** when you pass `--format`, `--output`, or both. For headless/CI runs, pair `--offline` (heuristics only, no API key required) with `-y` (auto-approve) or `-d` (dry-run) to avoid interactive prompts.

## Development Workflow
When modifying or extending corys-dev-cli:

```bash
# Run in development mode using tsx
npm run dev -- check --subagents security

# Run the unit test suite (Vitest)
npm test

# Build TypeScript to dist/
npm run build

# Run TypeScript build (used before publish; does not relink)
npm run prepublishOnly
```

Tests cover the pure logic (risk summaries, ignore rules, report generators, report-format validation) and the git-status helper. Test files live alongside the source under `src/` (`*.test.ts`) and are excluded from the production build.

> **Note on `git stash`:** the Git safety guard can auto-stash uncommitted changes before running. If it does, remember to `git stash pop` afterward to restore your work.

---

License
MIT © Corinna Rohr