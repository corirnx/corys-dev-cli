import { Command } from 'commander';
import path from 'node:path';
import { SubagentType } from '../../types/cli.js';
import { runMaintenance } from '../../orchestrator/runner.js';
import { printBanner, logError } from '../ui.js';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description('Run Corys-Dev maintenance subagents on a specified target repository')
    .argument('[path]', 'Target repository directory path', '.')
    .option(
      '-s, --subagents <types...>',
      'Specify subagents to execute (security, deps, refactor, all)',
      ['all']
    )
    .option('-v, --verbose', 'Enable verbose debug logging', false)
    .option('-d, --dry-run', 'Preview subagent analysis without modifying files', false)
    .option('-y, --auto-approve', 'Automatically apply suggested edits without prompting', false)
    .action(async (repoPath: string, options) => {
      try {
        printBanner();
        const absolutePath = path.resolve(process.cwd(), repoPath);

        await runMaintenance({
          targetDir: repoPath,
          absolutePath,
          options: {
            subagents: options.subagents as SubagentType[],
            verbose: Boolean(options.verbose),
            dryRun: Boolean(options.dryRun),
            autoApprove: Boolean(options.autoApprove)
          }
        });
      } catch (err) {
        logError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}