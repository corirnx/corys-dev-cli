import { SubagentResult } from '../types/agent.js';
import { ReportMeta } from '../types/cli.js';

export const sampleMeta: ReportMeta = {
    targetPath: '/repos/foo',
    targetDir: 'foo',
    gitBranch: 'main',
    gitCommit: 'abc1234',
    subagents: ['Security', 'DependencyAudit'],
    offline: false,
    dryRun: false,
    durationsMs: { Security: 120, DependencyAudit: 95 },
};

export const securityResult: SubagentResult = {
    agentName: 'Security',
    status: 'findings_found',
    summary: 'Found 2 security concern(s).',
    riskSummary: 'High-risk posture: immediate action is recommended. Found 2 finding(s) (1 high, 0 medium, 1 low) across 1 category(ies).',
    findings: [
        { type: 'secret', severity: 'high', message: 'Possible private key', location: 'src/key.pem' },
        { type: 'dependency', severity: 'low', message: 'Suspicious dep foo', location: 'package.json' },
    ],
};

export const depsResult: SubagentResult = {
    agentName: 'DependencyAudit',
    status: 'passed',
    summary: 'Dependencies and model references look clean.',
};