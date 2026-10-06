import { select } from '@inquirer/prompts';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import chalk from 'chalk';
import { CodeRewriteProposal } from '../types/agent.js';
import { renderProposalDiff, printProposalHeader } from '../cli/diff-viewer.js';
import { logSuccess, logError, logInfo } from '../cli/ui.js';

export type UserApprovalAction = 'apply' | 'branch' | 'skip';

export interface ReviewOptions {
    dryRun: boolean;
    autoApprove: boolean;
    cwd?: string;
}

export async function processProposalsInteractive(proposals: CodeRewriteProposal[], options: ReviewOptions): Promise<void> {
    if (!proposals || proposals.length === 0) {
        logSuccess('No code modification proposals require interactive approval.');
        return;
    }

    if (options.dryRun) {
        logInfo('Dry-run mode', 'Rendering all proposals without modifying files.');
    }

    for (let i = 0; i < proposals.length; i++) {
        const proposal = proposals[i];
        printProposalHeader(proposal, i, proposals.length);
        console.log(renderProposalDiff(proposal));

        if (options.dryRun) {
            logInfo('Dry-run', `Skipped write for ${proposal.filePath}`);
            continue;
        }

        let action: UserApprovalAction = 'skip';
        if (options.autoApprove) {
            action = 'apply';
            logSuccess('Auto-approve enabled: applying changes.');
        } else {
            action = await select<UserApprovalAction>({
                message: `How would you like to handle changes to ${path.basename(proposal.filePath)}?`,
                choices: [
                    { name: 'Apply changes directly', value: 'apply', description: 'Overwrite the file with the proposed code' },
                    { name: 'Apply and create git branch', value: 'branch', description: 'Write file, create branch, and commit' },
                    { name: 'Skip / Reject', value: 'skip', description: 'Do not modify this file' },
                ],
            });
        }

        if (action === 'apply') {
            await applyProposal(proposal, options.cwd);
        } else if (action === 'branch') {
            await applyOnBranch(proposal, options.cwd);
        } else {
            logInfo('Skipped', proposal.filePath);
        }
    }
}

async function applyProposal(proposal: CodeRewriteProposal, cwd?: string): Promise<void> {
    const resolvedPath = path.resolve(cwd ?? process.cwd(), proposal.filePath);
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, proposal.proposedCode, 'utf-8');
    logSuccess(`Updated ${proposal.filePath}`);
}

async function applyOnBranch(proposal: CodeRewriteProposal, cwd?: string): Promise<void> {
    const resolvedPath = path.resolve(cwd ?? process.cwd(), proposal.filePath);
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, proposal.proposedCode, 'utf-8');

    const branchName = `corys-dev/${proposal.filePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40)}-${Date.now()}`;
    const gitRoot = findGitRoot(path.dirname(resolvedPath));
    if (!gitRoot) {
        logError(`No git repository found for ${proposal.filePath}; file updated locally but branch not created.`);
        return;
    }

    try {
        const relativePath = path.relative(gitRoot, resolvedPath);
        execFileSync('git', ['checkout', '-b', branchName], { cwd: gitRoot, stdio: 'ignore' });
        execFileSync('git', ['add', relativePath], { cwd: gitRoot, stdio: 'ignore' });
        execFileSync('git', ['commit', '-m', `refactor(corys-dev): ${proposal.reasoning.slice(0, 60)}`], { cwd: gitRoot, stdio: 'ignore' });
        logSuccess(`Created branch ${branchName} and committed changes.`);
    } catch (err) {
        logError(`Git branch creation failed for ${proposal.filePath}. File was updated locally.`);
    }
}

function findGitRoot(startDir: string): string | undefined {
    let current = startDir;
    for (let i = 0; i < 50; i++) {
        const gitPath = path.join(current, '.git');
        if (existsSync(gitPath)) return current;
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }
    return undefined;
}