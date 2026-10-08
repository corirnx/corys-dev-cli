import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_IGNORES = [
    'node_modules/',
    'dist/',
    'build/',
    '.git/',
    '.next/',
    'coverage/',
    '*.min.js',
    '*.min.css',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.env'
];

export const CORYSIGNORE_FILENAME = '.corysignore';

export const DEFAULT_CORYSIGNORE = `# corys-dev ignore rules
# Fine-grained control over which paths the subagents (Grep/Glob/Read) touch.
# Syntax follows .gitignore. This file supplements .gitignore and is
# respected by corys-dev's heuristics and the SDK tool agents.
#
# Example entries:
# docs/
# src/generated/
# *.snap
#
# Note: node_modules/, dist/, build/, .git/, coverage/, lockfiles and minified
# assets are already excluded by default and do not need to be listed here.
`;

/**
 * Create a default `.corysignore` in `cwd` if one does not already exist,
 * so users have an obvious place for fine-grained ignore control.
 * Returns the file path when it was created, or `null` when one already exists.
 */
export async function ensureDefaultCorysIgnore(cwd: string): Promise<string | null> {
    const filePath = path.resolve(cwd, CORYSIGNORE_FILENAME);
    if (fs.existsSync(filePath)) return null;
    await fs.promises.writeFile(filePath, DEFAULT_CORYSIGNORE, 'utf-8');
    return filePath;
}

/**
 * Build a single combined ignore-rule document (gitignore syntax) from the
 * built-in defaults plus the target repository's `.gitignore` and `.corysignore`.
 * This is written to a temporary `.ignore` file that the Claude Agent SDK's
 * Grep/Glob/Read tools always respect.
 */
export async function buildCombinedIgnoreDocument(cwd: string): Promise<string> {
    const sections: string[] = ['# corys-dev default ignores'];

    sections.push(DEFAULT_IGNORES.join('\n'));

    for (const name of ['.gitignore', CORYSIGNORE_FILENAME]) {
        const content = await readFile(path.resolve(cwd, name), 'utf-8').catch(() => null);
        if (content) {
            sections.push(`\n# ${name}`);
            sections.push(content);
        }
    }

    return sections.join('\n');
}