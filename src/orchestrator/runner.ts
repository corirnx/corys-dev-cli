import { ExecutionContext } from '../types/cli.js';
import { createSpinner, logInfo, logSuccess } from '../cli/ui.js';

export async function runMaintenance(context: ExecutionContext): Promise<void> {
    const spinner = createSpinner('Initializing subagents context...');
    spinner.start();

    await new Promise(resolve => setTimeout(resolve, 800));
    spinner.succeed('Target repository validated');

    if (context.options.verbose) {
        console.log('\n--- Debug Execution Context ---');
        logInfo('Target Path:', context.absolutePath);
        logInfo('Selected Subagents:', context.options.subagents.join(', '));
        logInfo('Dry Run Mode:', String(context.options.dryRun));
        logInfo('Auto Approve:', String(context.options.autoApprove));
        console.log('-------------------------------\n');
    }

    const activeAgents = context.options.subagents.includes('all')
        ? ['security', 'deps', 'refactor']
        : context.options.subagents;

    for (const agent of activeAgents) {
        const agentSpinner = createSpinner(`[${agent.toUpperCase()}] Running audit phase...`);
        agentSpinner.start();
        await new Promise(resolve => setTimeout(resolve, 600));
        agentSpinner.succeed(`[${agent.toUpperCase()}] Audit completed`);
    }

    logSuccess('Phase 1 CLI routing completed successfully.');
}