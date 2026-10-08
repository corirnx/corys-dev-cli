import { Command } from 'commander';
import path from 'node:path';
import { SubagentType, ReportFormat } from '../../types/cli.js';
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
        .option('-d, --dry-run', 'Preview subagent analysis without modifying files', false)
        .option('-y, --auto-approve', 'Automatically apply suggested edits without prompting', false)
        .option('-o, --offline', 'Run heuristic audits without calling the Agent SDK (no API key required)', false)
        .option('-f, --format <format>', 'Export audit report as markdown, json, or html', '')
        .option('--output <filePath>', 'File path to write the audit report to', '')
        .action(async (repoPath: string, options) => {
            try {
                printBanner();
                const absolutePath = path.resolve(process.cwd(), repoPath);

                const format = options.format as string;
                await runMaintenance({
                    targetDir: repoPath,
                    absolutePath,
                    options: {
                        subagents: options.subagents as SubagentType[],
                        dryRun: Boolean(options.dryRun),
                        autoApprove: Boolean(options.autoApprove),
                        offline: Boolean(options.offline),
                        ...(format ? { format: validateReportFormat(format) } : {}),
                        ...(options.output ? { output: options.output as string } : {})
                    }
                });
            } catch (err) {
                logError(err instanceof Error ? err.message : String(err));
                process.exit(1);
            }
        });
}

export function validateReportFormat(value: string): ReportFormat {
    if (value === 'markdown' || value === 'json' || value === 'html') {
        return value;
    }
    throw new Error(`Invalid report format "${value}". Expected one of: markdown, json, html.`);
}