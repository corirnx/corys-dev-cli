import fs from 'node:fs/promises';
import path from 'node:path';
import { SubagentResult } from '../types/agent.js';
import { ReportFormat, ReportMeta } from '../types/cli.js';
import { generateMarkdownReport } from './markdown.js';
import { generateJsonReport } from './json.js';
import { generateHtmlReport } from './html.js';
import { logSuccess, logError } from '../cli/ui.js';

export async function saveAuditReport(
    results: SubagentResult[],
    meta: ReportMeta,
    format: ReportFormat,
    outputPath?: string
): Promise<void> {
    let content = '';
    const defaultFilename = `corys-audit-report.${format === 'markdown' ? 'md' : format}`;
    const targetPath = outputPath ? path.resolve(process.cwd(), outputPath) : path.resolve(process.cwd(), defaultFilename);

    switch (format) {
        case 'markdown':
            content = generateMarkdownReport(results, meta);
            break;
        case 'json':
            content = generateJsonReport(results, meta);
            break;
        case 'html':
            content = generateHtmlReport(results, meta);
            break;
        default:
            logError(`Unsupported report format: ${format}`);
            return;
    }

    try {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, content, 'utf-8');
        logSuccess(`Audit report saved to: ${targetPath}`);
    } catch (err) {
        logError(`Failed to save audit report: ${String(err)}`);
    }
}