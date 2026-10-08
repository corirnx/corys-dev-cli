import { SubagentResult } from '../types/agent.js';
import { ReportMeta } from '../types/cli.js';

export function generateJsonReport(results: SubagentResult[], meta: ReportMeta): string {
    const payload = {
        generatedAt: new Date().toISOString(),
        meta: {
            targetPath: meta.targetPath,
            targetDir: meta.targetDir,
            gitBranch: meta.gitBranch,
            gitCommit: meta.gitCommit,
            subagents: meta.subagents,
            offline: meta.offline,
            dryRun: meta.dryRun,
            durationsMs: meta.durationsMs,
        },
        totalSubagents: results.length,
        passedCount: results.filter((r) => r.status === 'passed').length,
        findingsCount: results.filter((r) => r.status === 'findings_found').length,
        failedCount: results.filter((r) => r.status === 'failed').length,
        results
    };

    return JSON.stringify(payload, null, 2);
}