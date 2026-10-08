import { describe, it, expect } from 'vitest';
import { summarizeRisk } from './risk.js';
import { Finding } from '../types/agent.js';

const findings = (severity: Finding['severity'][]): Finding[] =>
    severity.map((s) => ({ type: 'test', severity: s, message: 'x', location: 'a' }));

describe('summarizeRisk', () => {
    it('reports no risk for empty findings', () => {
        expect(summarizeRisk([])).toBe('No risk-inducing findings detected.');
    });

    it('reports high-risk posture when a high finding exists', () => {
        const out = summarizeRisk(findings(['high']));
        expect(out).toContain('High-risk posture');
        expect(out).toContain('(1 high, 0 medium, 0 low)');
    });

    it('reports medium-risk posture when only medium findings exist', () => {
        const out = summarizeRisk(findings(['medium']));
        expect(out).toContain('Medium-risk posture');
    });

    it('reports low-risk posture when only low findings exist', () => {
        const out = summarizeRisk(findings(['low']));
        expect(out).toContain('Low-risk posture');
    });

    it('counts by severity and category', () => {
        const mixed: Finding[] = [
            { type: 'secret', severity: 'high', message: 'a' },
            { type: 'secret', severity: 'low', message: 'b' },
            { type: 'dependency', severity: 'low', message: 'c' },
        ];
        const out = summarizeRisk(mixed);
        expect(out).toContain('3 finding(s) (1 high, 0 medium, 2 low)');
        expect(out).toContain('2 category(ies)');
    });
});