import { SubagentResult } from '../types/agent.js';
import { ReportMeta } from '../types/cli.js';

export function generateMarkdownReport(results: SubagentResult[], meta: ReportMeta): string {
    const timestamp = new Date().toISOString();
    let md = `# Corys-Dev Audit Report\n\n`;

    // Run context
    md += `**Target:** \`${meta.targetDir}\`  \n`;
    md += `**Absolute path:** \`${meta.targetPath}\`  \n`;
    if (meta.gitBranch) md += `**Git branch:** \`${meta.gitBranch}\`  \n`;
    if (meta.gitCommit) md += `**Git commit:** \`${meta.gitCommit}\`  \n`;
    md += `**Generated:** ${timestamp}  \n`;
    md += `**Subagents:** ${meta.subagents.join(', ') || 'none'}  \n`;
    md += `**Mode:** ${meta.offline ? 'offline (heuristics)' : 'online (AI agent)'}${meta.dryRun ? ' / dry-run' : ''}  \n`;
    md += `\n--- \n\n`;

    md += `## Executive Summary\n\n`;
    results.forEach((res) => {
        const icon = res.status === 'passed' ? '✅' : res.status === 'findings_found' ? '⚠️' : '❌';
        const duration = meta.durationsMs[res.agentName];
        const durationText = duration !== undefined ? ` (${duration} ms)` : '';
        md += `- **${res.agentName}**: ${icon} ${res.status.toUpperCase()}${durationText}\n`;
    });

    md += `\n---\n\n## Subagent Details\n\n`;

    results.forEach((res) => {
        md += `### ${res.agentName} Agent\n`;
        md += `**Status:** \`${res.status}\`  \n`;
        const duration = meta.durationsMs[res.agentName];
        if (duration !== undefined) md += `**Duration:** ${duration} ms  \n`;
        md += `**Summary:**  \n${res.summary}\n\n`;

        if (res.findings && res.findings.length > 0) {
            md += `#### Findings\n\n`;
            res.findings.forEach((finding) => {
                md += `- ${finding}\n`;
            });
            md += `\n`;
        }

        if (res.proposals && res.proposals.length > 0) {
            md += `#### Proposed Code Modifications\n\n`;
            res.proposals.forEach((p, idx) => {
                md += `##### Proposal ${idx + 1}: \`${p.filePath}\`\n`;
                md += `**Reasoning:** ${p.reasoning}\n\n`;
                md += `\`\`\`diff\n// Original\n${p.originalCode}\n\n// Proposed\n${p.proposedCode}\n\`\`\`\n\n`;
            });
        }

        if (res.errors && res.errors.length > 0) {
            md += `#### Execution Errors\n`;
            res.errors.forEach((err) => {
                md += `- \`${err}\`  \n`;
            });
            md += `\n`;
        }
    });

    return md;
}