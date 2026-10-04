import { execSync } from 'node:child_process';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { logError } from '../cli/ui.js';

export type GitGuardDecision = 'proceed' | 'stash' | 'abort';

export interface GitStatusInfo {
    isClean: boolean;
    uncommittedFiles: string[];
}

export function getGitStatus(cwd: string): GitStatusInfo {
    try {
        const statusOutput = execSync('git status --porcelain', {
            cwd,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();

        if (!statusOutput) {
            return { isClean: true, uncommittedFiles: [] };
        }

        const uncommittedFiles = statusOutput
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);

        return { isClean: false, uncommittedFiles };
    } catch {
        // Return clean if target directory is not a Git repository
        return { isClean: true, uncommittedFiles: [] };
    }
}

export async function ensureCleanGitState(
    cwd: string,
    options: { dryRun: boolean; autoApprove: boolean }
): Promise<boolean> {
    const { isClean, uncommittedFiles } = getGitStatus(cwd);

    if (isClean || options.dryRun) {
        return true;
    }

    console.log('\n' + chalk.yellow.bold('⚠️  Uncommitted local changes detected in working directory:'));
    uncommittedFiles.slice(0, 5).forEach((file) => {
        console.log(chalk.dim(`   • ${file}`));
    });

    if (uncommittedFiles.length > 5) {
        console.log(chalk.dim(`   ... and ${uncommittedFiles.length - 5} more file(s)`));
    }

    if (options.autoApprove) {
        console.log(chalk.yellow('\n🚀 --auto-approve flag passed. Bypassing Git safety guard.\n'));
        return true;
    }

    const choice = await select<GitGuardDecision>({
        message: 'How would you like to handle existing uncommitted changes?',
        choices: [
            { name: '📦 Stash changes temporarily (`git stash`)', value: 'stash' },
            { name: '🚀 Continue anyway (risk overwriting local edits)', value: 'proceed' },
            { name: '❌ Abort execution', value: 'abort' }
        ]
    });

    if (choice === 'abort') {
        logError('Execution aborted by user to preserve uncommitted work.');
        return false;
    }

    if (choice === 'stash') {
        try {
            execSync('git stash push -m "corys-dev: auto-stash before agent maintenance"', {
                cwd,
                stdio: 'ignore'
            });
            console.log(chalk.green('\n✔ Uncommitted changes stashed successfully.'));
        } catch {
            logError('Failed to stash working directory changes.');
            return false;
        }
    }

    return true;
}