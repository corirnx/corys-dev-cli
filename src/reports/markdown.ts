import { SubagentResult } from '../types/agent.js';

export function generateMarkdownReport(results: SubagentResult[]): string {
    const timestamp = new Date().toISOString();
    let md = `# Corys-Dev Audit Report\n\n`;
    md += `**Generated:** ${timestamp}\n\n`;
    md += `--- \n\n`;

    md += `## Executive Summary\n\n`;
    results.forEach((res) => {
        const icon = res.status === 'passed' ? '✅' : res.status === 'findings_found' ? '⚠️' : '❌';
        md += `- **${res.agentName}**: ${icon} ${res.status.toUpperCase()}\n`;
    });

    md += `\n---\n\n## Subagent Details\n\n`;

    results.forEach((res) => {
        md += `### ${res.agentName} Agent\n`;
        md += `**Status:** \`${res.status}\`  \n`;
        md += `**Summary:**  \n${res.summary}\n\n`;

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