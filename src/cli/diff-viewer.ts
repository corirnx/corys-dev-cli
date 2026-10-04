import chalk from 'chalk';
import { createTwoFilesPatch } from 'diff';
import { CodeRewriteProposal } from '../types/agent.js';

export function renderProposalDiff(proposal: CodeRewriteProposal): string {
    const patch = createTwoFilesPatch(
        proposal.filePath,
        proposal.filePath,
        normalizeTrailingNewline(proposal.originalCode),
        normalizeTrailingNewline(proposal.proposedCode),
        undefined,
        undefined,
        { context: 3 }
    );
    return colorizePatch(patch);
}

export function colorizePatch(patch: string): string {
    return patch
        .split('\n')
        .map((line) => {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                return chalk.green(line);
            }
            if (line.startsWith('-') && !line.startsWith('---')) {
                return chalk.red(line);
            }
            if (line.startsWith('@@')) {
                return chalk.cyan(line);
            }
            if (line.startsWith('---') || line.startsWith('+++')) {
                return chalk.yellow(line);
            }
            if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('======')) {
                return chalk.dim(line);
            }
            return line;
        })
        .join('\n');
}

function normalizeTrailingNewline(text: string): string {
    return text.endsWith('\n') ? text : text + '\n';
}

export function printProposalHeader(proposal: CodeRewriteProposal, index: number, total: number): void {
    console.log('\n' + chalk.bold.cyan('━'.repeat(70)));
    console.log(chalk.bold.white(`Proposal ${index + 1} of ${total}`));
    console.log(chalk.dim('File: ') + chalk.bold(proposal.filePath));
    console.log(chalk.dim('Reasoning: ') + proposal.reasoning);
    console.log(chalk.bold.cyan('━'.repeat(70)));
}