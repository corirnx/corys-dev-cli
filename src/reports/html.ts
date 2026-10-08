import { SubagentResult } from '../types/agent.js';
import { ReportMeta } from '../types/cli.js';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function statusBadgeClass(status: SubagentResult['status']): string {
    switch (status) {
        case 'passed':
            return 'bg-green-100 text-green-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
}

export function generateHtmlReport(results: SubagentResult[], meta: ReportMeta): string {
    const timestamp = new Date().toLocaleString();

    const metaHtml = `
      <div class="text-sm text-gray-500 mb-4 space-y-1">
        <p><strong>Target:</strong> <code>${escapeHtml(meta.targetDir)}</code></p>
        <p><strong>Absolute path:</strong> <code>${escapeHtml(meta.targetPath)}</code></p>
        ${meta.gitBranch ? `<p><strong>Branch:</strong> <code>${escapeHtml(meta.gitBranch)}</code></p>` : ''}
        ${meta.gitCommit ? `<p><strong>Commit:</strong> <code>${escapeHtml(meta.gitCommit)}</code></p>` : ''}
        <p><strong>Subagents:</strong> ${escapeHtml(meta.subagents.join(', ') || 'none')}</p>
        <p><strong>Mode:</strong> ${meta.offline ? 'offline (heuristics)' : 'online (AI agent)'}${meta.dryRun ? ' / dry-run' : ''}</p>
      </div>`;

    const rows = results
        .map((r) => {
            const badgeClass = statusBadgeClass(r.status);
            const duration = meta.durationsMs[r.agentName];
            const durationText = duration !== undefined ? ` (${duration} ms)` : '';
            const findingsHtml = r.findings && r.findings.length > 0
                ? `<div class="mt-3 bg-gray-100 p-3 rounded">
                <p class="font-semibold text-sm">Findings (${r.findings.length}):</p>
                <ul class="list-disc pl-5 text-sm">
                  ${r.findings.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
               </div>`
                : '';
            const proposalsHtml = r.proposals && r.proposals.length > 0
                ? `<div class="mt-3 bg-gray-50 p-3 rounded">
                <p class="font-semibold text-sm">Proposals (${r.proposals.length}):</p>
                <ul class="list-disc pl-5 text-sm">
                  ${r.proposals.map((p) => `<li><code>${escapeHtml(p.filePath)}</code> - ${escapeHtml(p.reasoning)}</li>`).join('')}
                </ul>
               </div>`
                : '';

            return `
      <div class="card mb-4 p-4 border rounded shadow-sm">
        <div class="d-flex justify-between align-center mb-2">
          <h3 class="font-bold text-lg">${escapeHtml(r.agentName)} Subagent</h3>
          <span class="px-2 py-1 text-xs rounded font-semibold ${badgeClass}">${escapeHtml(r.status)}${escapeHtml(durationText)}</span>
        </div>
        <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(r.summary)}</p>
        ${findingsHtml}
        ${proposalsHtml}
      </div>`;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Corys-Dev Maintenance Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8 font-sans">
  <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-1">corys-dev Audit Report</h1>
    <p class="text-gray-500 text-sm mb-6">Generated on ${escapeHtml(timestamp)}</p>
    ${metaHtml}
    <div>${rows}</div>
  </div>
</body>
</html>`;
}