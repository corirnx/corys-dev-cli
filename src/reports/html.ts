import { SubagentResult } from '../types/agent.js';

export function generateHtmlReport(results: SubagentResult[]): string {
    const timestamp = new Date().toLocaleString();

    const rows = results
        .map((r) => {
            const badgeClass =
                r.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            return `
      <div class="card mb-4 p-4 border rounded shadow-sm">
        <div class="d-flex justify-between align-center mb-2">
          <h3 class="font-bold text-lg">${r.agentName} Subagent</h3>
          <span class="px-2 py-1 text-xs rounded font-semibold ${badgeClass}">${r.status}</span>
        </div>
        <p class="text-gray-700 whitespace-pre-wrap">${r.summary}</p>
        ${r.proposals && r.proposals.length > 0
                    ? `<div class="mt-3 bg-gray-50 p-3 rounded">
                <p class="font-semibold text-sm">Proposals (${r.proposals.length}):</p>
                <ul class="list-disc pl-5 text-sm">
                  ${r.proposals.map((p) => `<li><code>${p.filePath}</code> - ${p.reasoning}</li>`).join('')}
                </ul>
               </div>`
                    : ''
                }
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
    <p class="text-gray-500 text-sm mb-6">Generated on ${timestamp}</p>
    <div>${rows}</div>
  </div>
</body>
</html>`;
}