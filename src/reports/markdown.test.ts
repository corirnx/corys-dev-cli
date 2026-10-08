import { describe, it, expect } from 'vitest';
import { generateMarkdownReport } from './markdown.js';
import { sampleMeta, securityResult, depsResult } from './fixtures.js';

describe('generateMarkdownReport', () => {
    it('includes run metadata', () => {
        const md = generateMarkdownReport([depsResult], sampleMeta);
        expect(md).toContain('**Target:** `foo`');
        expect(md).toContain('**Git branch:** `main`');
        expect(md).toContain('**Git commit:** `abc1234`');
        expect(md).toContain('online (AI agent)');
    });

    it('renders structured findings with severity and location', () => {
        const md = generateMarkdownReport([securityResult], sampleMeta);
        expect(md).toContain('#### Findings (2)');
        expect(md).toContain('**By severity:** high (1), low (1)');
        expect(md).toContain('**[high]** `secret` `src/key.pem`: Possible private key');
        expect(md).toContain('**[low]** `dependency` `package.json`: Suspicious dep foo');
    });

    it('renders risk assessment', () => {
        const md = generateMarkdownReport([securityResult], sampleMeta);
        expect(md).toContain('**Risk assessment:** High-risk posture');
    });

    it('omits findings section when there are none', () => {
        const md = generateMarkdownReport([depsResult], sampleMeta);
        expect(md).not.toContain('#### Findings');
    });
});