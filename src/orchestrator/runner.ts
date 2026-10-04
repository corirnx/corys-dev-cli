import { ExecutionContext } from '../types/cli.js';
import { AgentContext, SubagentResult } from '../types/agent.js';
import { SecurityAgent } from '../subagents/security.js';
import { DependencyAuditAgent } from '../subagents/deps.js';
import { RefactorAgent } from '../subagents/refactor.js';
import { createSpinner, logInfo, logSuccess, logError } from '../cli/ui.js';

export async function runMaintenance(context: ExecutionContext): Promise<SubagentResult[]> {
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

    if (context.options.verbose) {
        console.log('\n--- Phase 2 Subagent Raw Results ---');
        results.forEach(r => logInfo(`Agent [${r.agentName}]:`, r.summary));
        console.log('-------------------------------------\n');
    }

    const failures = results.filter(r => r.status === 'failed' || (r.errors && r.errors.length > 0));
    if (failures.length > 0) {
        for (const f of failures) {
            logError(`[${f.agentName}] ${f.summary}`);
            if (f.errors) f.errors.forEach(e => logError(`  - ${e}`));
        }
    }

    logSuccess('Phase 2 Subagent execution finished.');
    return results;
}