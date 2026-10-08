import { SubagentResult } from '../types/agent.js';
import { ReportMeta } from '../types/cli.js';
import { createTwoFilesPatch } from 'diff';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeTrailingNewline(text: string): string {
    return text.endsWith('\n') ? text : text + '\n';
}

function renderProposalDiffHtml(original: string, proposed: string): string {
    const patch = createTwoFilesPatch('original', 'proposed', normalizeTrailingNewline(original), normalizeTrailingNewline(proposed));
    return escapeHtml(patch);
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
                  ${r.findings.map((f) => {
                      const sevClass = f.severity === 'high' ? 'bg-red-100 text-red-800'
                          : f.severity === 'medium' ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-200 text-gray-700';
                      const loc = f.location ? `<code>${escapeHtml(f.location)}</code> ` : '';
                      return `<li><span class="px-1 py-0.5 text-xs rounded font-semibold ${sevClass}">${escapeHtml(f.severity)}</span> ${loc}${escapeHtml(f.message)}</li>`;
                  }).join('')}
                </ul>
               </div>`
                : '';
            const proposalsHtml = r.proposals && r.proposals.length > 0
                ? `<div class="mt-3 bg-gray-50 p-3 rounded">
                <p class="font-semibold text-sm">Proposals (${r.proposals.length}):</p>
                ${r.proposals.map((p) => `
                <div class="mt-2 border rounded p-2 bg-white">
                  <p class="text-sm"><code>${escapeHtml(p.filePath)}</code> — ${escapeHtml(p.reasoning)}</p>
                  <pre class="mt-2 text-xs overflow-auto bg-gray-900 text-green-300 p-2 rounded">${renderProposalDiffHtml(p.originalCode, p.proposedCode)}</pre>
                </div>`).join('')}
               </div>`
                : '';

            return `
      <div class="card mb-4 p-4 border rounded shadow-sm">
        <div class="d-flex justify-between align-center mb-2">
          <h3 class="font-bold text-lg">${escapeHtml(r.agentName)} Subagent</h3>
          <span class="px-2 py-1 text-xs rounded font-semibold ${badgeClass}">${escapeHtml(r.status)}${escapeHtml(durationText)}</span>
        </div>
        <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(r.summary)}</p>
        ${r.riskSummary ? `<p class="mt-2 text-sm font-medium text-gray-800">${escapeHtml(r.riskSummary)}</p>` : ''}
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