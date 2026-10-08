import { describe, it, expect } from 'vitest';
import { validateReportFormat } from './check.js';

describe('validateReportFormat', () => {
    it('accepts markdown, json, html', () => {
        expect(validateReportFormat('markdown')).toBe('markdown');
        expect(validateReportFormat('json')).toBe('json');
        expect(validateReportFormat('html')).toBe('html');
    });

    it('throws on invalid format', () => {
        expect(() => validateReportFormat('pdf')).toThrow(/Invalid report format/);
    });
});