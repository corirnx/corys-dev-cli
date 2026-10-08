import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
}));

import { loadAndMapEnvironment } from './env.js';

const ORIGINAL: Record<string, string | undefined> = {};

beforeEach(() => {
    ORIGINAL.PROVIDER_NAME = process.env.PROVIDER_NAME;
    ORIGINAL.MODEL_PROVIDER_KEY = process.env.MODEL_PROVIDER_KEY;
    ORIGINAL.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    ORIGINAL.MODEL_PROVIDER_URL = process.env.MODEL_PROVIDER_URL;
    ORIGINAL.MODEL_NAME = process.env.MODEL_NAME;
    Object.keys(process.env).forEach((k) => {
        if (k.startsWith('ANTHROPIC_') || k === 'CLAUDE_CODE_USE_VERTEX' || k === 'DOTENV_QUIET') delete process.env[k];
    });
});

afterEach(() => {
    Object.keys(process.env).forEach((k) => {
        if (k.startsWith('ANTHROPIC_') || k === 'CLAUDE_CODE_USE_VERTEX' || k === 'DOTENV_QUIET') delete process.env[k];
    });
    for (const [k, v] of Object.entries(ORIGINAL)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
});

describe('loadAndMapEnvironment', () => {
    it('maps openrouter to auth token and clears api key', () => {
        process.env.PROVIDER_NAME = 'openrouter';
        process.env.MODEL_PROVIDER_KEY = 'or-key';
        loadAndMapEnvironment('/some/dir');
        expect(process.env.ANTHROPIC_AUTH_TOKEN).toBe('or-key');
        expect(process.env.ANTHROPIC_API_KEY).toBe('');
    });

    it('maps anthropic to api key and model', () => {
        process.env.PROVIDER_NAME = 'anthropic';
        process.env.ANTHROPIC_API_KEY = 'ak-key';
        process.env.MODEL_NAME = 'claude-sonnet-4';
        loadAndMapEnvironment('/some/dir');
        expect(process.env.ANTHROPIC_API_KEY).toBe('ak-key');
        expect(process.env.ANTHROPIC_MODEL).toBe('claude-sonnet-4');
    });

    it('flags vertexai via CLAUDE_CODE_USE_VERTEX', () => {
        process.env.PROVIDER_NAME = 'vertexai';
        loadAndMapEnvironment('/some/dir');
        expect(process.env.CLAUDE_CODE_USE_VERTEX).toBe('1');
    });

    it('maps custom to auth token and clears api key', () => {
        process.env.PROVIDER_NAME = 'custom';
        process.env.MODEL_PROVIDER_KEY = 'custom-key';
        loadAndMapEnvironment('/some/dir');
        expect(process.env.ANTHROPIC_AUTH_TOKEN).toBe('custom-key');
        expect(process.env.ANTHROPIC_API_KEY).toBe('');
    });

    it('falls back to anthropic config for unknown provider', () => {
        process.env.PROVIDER_NAME = 'bogus';
        process.env.ANTHROPIC_API_KEY = 'fallback-key';
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
        loadAndMapEnvironment('/some/dir');
        expect(process.env.ANTHROPIC_API_KEY).toBe('fallback-key');
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});