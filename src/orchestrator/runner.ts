import { ExecutionContext, ReportMeta } from '../types/cli.js';
import { AgentContext, SubagentResult, CodeRewriteProposal } from '../types/agent.js';
import { ensureCleanGitState } from '../git/guard.js';
import { SecurityAgent } from '../subagents/security.js';
import { DependencyAuditAgent } from '../subagents/deps.js';
import { RefactorAgent } from '../subagents/refactor.js';
import { processProposalsInteractive } from '../git/reviewer.js';
import { ensureDefaultCorysIgnore } from '../utils/ignore.js';
import { saveAuditReport } from '../reports/generator.js';
import { createSpinner, logSuccess, logInfo } from '../cli/ui.js';
import { execSync } from 'node:child_process';

export async function runMaintenance(context: ExecutionContext): Promise<SubagentResult[]> {
    const readyToProceed = await ensureCleanGitState(context.absolutePath, {
        dryRun: context.options.dryRun,
        autoApprove: context.options.autoApprove
    });

    if (!readyToProceed) {
        return [];
    }

    const created = context.options.dryRun
        ? null
        : await ensureDefaultCorysIgnore(context.absolutePath);
    if (created) {
        logInfo('Created', `${created} (default ignore file)`);
    }

    const results: SubagentResult[] = [];
    const selected = context.options.subagents;
    const runAll = selected.includes('all');

    const agentContext: AgentContext = {
        targetPath: context.absolutePath,
        offline: context.options.offline,
    };

    const durationsMs: Record<string, number> = {};

    async function timedRun(agentName: string, run: () => Promise<SubagentResult>): Promise<SubagentResult> {
        const start = performance.now();
        const res = await run();
        durationsMs[agentName] = Math.round(performance.now() - start);
        return res;
    }

    if (runAll || selected.includes('security')) {
        const spinner = createSpinner('[SECURITY] Running security & secrets audit...');
        spinner.start();
        const res = await timedRun('Security', () => new SecurityAgent().run(agentContext));
        res.status === 'failed' ? spinner.fail('[SECURITY] Audit failed') : spinner.succeed('[SECURITY] Audit completed');
        results.push(res);
    }

    if (runAll || selected.includes('deps')) {
        const spinner = createSpinner('[DEPENDENCIES] Auditing lockfiles & models.dev...');
        spinner.start();
        const res = await timedRun('DependencyAudit', () => new DependencyAuditAgent().run(agentContext));
        res.status === 'failed' ? spinner.fail('[DEPENDENCIES] Audit failed') : spinner.succeed('[DEPENDENCIES] Audit completed');
        results.push(res);
    }

    if (runAll || selected.includes('refactor')) {
        const spinner = createSpinner('[REFACTOR] Analyzing AST and code quality...');
        spinner.start();
        const res = await timedRun('Refactor', () => new RefactorAgent().run(agentContext));
        res.status === 'failed' ? spinner.fail('[REFACTOR] Analysis failed') : spinner.succeed('[REFACTOR] Analysis completed');
        results.push(res);
    }

    const allProposals: CodeRewriteProposal[] = [];
    for (const res of results) {
        if (res.proposals && res.proposals.length > 0) {
            allProposals.push(...res.proposals);
        }
    }

    // Export a structured audit report when the user opted in via --format or --output.
    const { format, output } = context.options;
    if (format || output) {
        const meta: ReportMeta = {
            targetPath: context.absolutePath,
            targetDir: context.targetDir,
            gitBranch: getGitBranch(context.absolutePath),
            gitCommit: getGitCommit(context.absolutePath),
            subagents: results.map((r) => r.agentName),
            offline: context.options.offline,
            dryRun: context.options.dryRun,
            durationsMs,
        };
        await saveAuditReport(results, meta, format ?? 'markdown', output);
    }

    if (allProposals.length > 0) {
        await processProposalsInteractive(allProposals, {
            dryRun: context.options.dryRun,
            autoApprove: context.options.autoApprove,
            cwd: context.absolutePath,
        });
    } else {
        logSuccess('No code modification proposals require interactive approval.');
    }

    return results;
}

function getGitBranch(cwd: string): string | undefined {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' })
            .trim() || undefined;
    } catch {
        return undefined;
    }
}

function getGitCommit(cwd: string): string | undefined {
    try {
        return execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf-8' })
            .trim() || undefined;
    } catch {
        return undefined;
    }
}