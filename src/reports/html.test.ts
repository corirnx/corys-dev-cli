import { describe, it, expect } from 'vitest';
import { generateHtmlReport } from './html.js';
import { sampleMeta, securityResult } from './fixtures.js';
import { SubagentResult } from '../types/agent.js';

const refactorResult: SubagentResult = {
    agentName: 'Refactor',
    status: 'findings_found',
    summary: 'Proposed refactoring for 1 file(s).',
    proposals: [{ filePath: 'src/a.ts', originalCode: 'const x = 1;', proposedCode: 'const x = 2;', reasoning: 'bump value' }],
};

describe('generateHtmlReport', () => {
    it('renders severity badges', () => {
        const html = generateHtmlReport([securityResult], sampleMeta);
        expect(html).toContain('bg-red-100'); // high
        expect(html).toContain('bg-gray-200'); // low
    });

    it('escapes HTML in findings and proposals', () => {
        const messy = JSON.parse(JSON.stringify(securityResult));
        messy.findings[0].message = '<script>alert(1)</script>';
        const html = generateHtmlReport([messy], sampleMeta);
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>alert');
    });

    it('renders diff detail for proposals', () => {
        const html = generateHtmlReport([refactorResult], sampleMeta);
        expect(html).toContain('src/a.ts');
        expect(html).toContain('const x = 1');
    });
});