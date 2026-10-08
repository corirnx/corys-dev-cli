import { describe, it, expect } from 'vitest';
import { generateJsonReport } from './json.js';
import { sampleMeta, securityResult } from './fixtures.js';

describe('generateJsonReport', () => {
    it('serializes meta and structured results', () => {
        const parsed = JSON.parse(generateJsonReport([securityResult], sampleMeta));
        expect(parsed.meta.gitBranch).toBe('main');
        expect(parsed.meta.durationsMs.Security).toBe(120);
        expect(parsed.totalSubagents).toBe(1);
        expect(parsed.findingsCount).toBe(1);
        expect(parsed.results[0].findings[0].severity).toBe('high');
        expect(parsed.results[0].findings[0].location).toBe('src/key.pem');
    });
});