import { ExecutionContext } from '../types/cli.js';
import { AgentContext, SubagentResult, CodeRewriteProposal } from '../types/agent.js';
import { ensureCleanGitState } from '../git/guard.js';
import { SecurityAgent } from '../subagents/security.js';
import { DependencyAuditAgent } from '../subagents/deps.js';
import { RefactorAgent } from '../subagents/refactor.js';
import { processProposalsInteractive } from '../git/reviewer.js';
import { ensureDefaultCorysIgnore } from '../utils/ignore.js';
import { createSpinner, logSuccess, logInfo } from '../cli/ui.js';

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
        dryRun: context.options.dryRun,
        verbose: context.options.verbose,
        offline: context.options.offline,
    };

    if (runAll || selected.includes('security')) {
        const spinner = createSpinner('[SECURITY] Running security & secrets audit...');
        spinner.start();
        const res = await new SecurityAgent().run(agentContext);
        res.status === 'failed' ? spinner.fail('[SECURITY] Audit failed') : spinner.succeed('[SECURITY] Audit completed');
        results.push(res);
    }

    if (runAll || selected.includes('deps')) {
        const spinner = createSpinner('[DEPENDENCIES] Auditing lockfiles & models.dev...');
        spinner.start();
        const res = await new DependencyAuditAgent().run(agentContext);
        res.status === 'failed' ? spinner.fail('[DEPENDENCIES] Audit failed') : spinner.succeed('[DEPENDENCIES] Audit completed');
        results.push(res);
    }

    if (runAll || selected.includes('refactor')) {
        const spinner = createSpinner('[REFACTOR] Analyzing AST and code quality...');
        spinner.start();
        const res = await new RefactorAgent().run(agentContext);
        res.status === 'failed' ? spinner.fail('[REFACTOR] Analysis failed') : spinner.succeed('[REFACTOR] Analysis completed');
        results.push(res);
    }

    const allProposals: CodeRewriteProposal[] = [];
    for (const res of results) {
        if (res.proposals && res.proposals.length > 0) {
            allProposals.push(...res.proposals);
        }
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