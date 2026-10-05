import { SubagentResult } from '../types/agent.js';

export function generateJsonReport(results: SubagentResult[]): string {
    const payload = {
        generatedAt: new Date().toISOString(),
        totalSubagents: results.length,
        passedCount: results.filter((r) => r.status === 'passed').length,
        findingsCount: results.filter((r) => r.status === 'findings_found').length,
        failedCount: results.filter((r) => r.status === 'failed').length,
        results
    };

    return JSON.stringify(payload, null, 2);
}