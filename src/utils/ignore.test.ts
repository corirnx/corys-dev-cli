import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCombinedIgnoreDocument, ensureDefaultCorysIgnore, DEFAULT_CORYSIGNORE } from './ignore.js';

let dir: string;

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'corys-ignore-test-'));
});

afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
});

describe('ensureDefaultCorysIgnore', () => {
    it('creates a default .corysignore when absent', async () => {
        const created = await ensureDefaultCorysIgnore(dir);
        expect(created).not.toBeNull();
        expect(existsSync(join(dir, '.corysignore'))).toBe(true);
    });

    it('returns null and does not overwrite an existing file', async () => {
        writeFileSync(join(dir, '.corysignore'), '# custom');
        const created = await ensureDefaultCorysIgnore(dir);
        expect(created).toBeNull();
        expect(readFileSync(join(dir, '.corysignore'), 'utf-8')).toBe('# custom');
    });
});

describe('buildCombinedIgnoreDocument', () => {
    it('includes built-in defaults and gitignore/corysignore content', async () => {
        writeFileSync(join(dir, '.gitignore'), 'temp.log');
        writeFileSync(join(dir, '.corysignore'), DEFAULT_CORYSIGNORE);
        const doc = await buildCombinedIgnoreDocument(dir);
        expect(doc).toContain('node_modules/');
        expect(doc).toContain('temp.log');
        expect(doc).toContain('# .gitignore');
        expect(doc).toContain('# .corysignore');
    });
});