import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { BaseSubagent } from './base.js';
import { AgentContext, SubagentResult } from '../types/agent.js';

const SENSITIVE_PATTERNS = [
    /['"]?(?:api[_-]?key|apikey|api_secret|secret[_-]?key|password|token|jwt)['"]?\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi,
    /^-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/gm,
    /AKIA[0-9A-Z]{16}/,
    /(?:gh[psor]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/g,
    /glpat-[A-Za-z0-9_\-]{20,}/g,
];

export class SecurityAgent extends BaseSubagent {
    readonly name = 'Security' as const;

    async run(context: AgentContext): Promise<SubagentResult> {
        const findings: string[] = [];
        try {
            await this.scanDirectory(context.targetPath, findings);
            findings.push(...(await this.auditLockfiles(context.targetPath)));

            if (!context.offline) {
                const agentSummary = await this.queryAgentWithIgnore(context, {
                                prompt: `Perform a strict security audit on ${context.targetPath}. Look for hardcoded secrets, insecure dependencies, and leaked credentials. Return a concise JSON summary: {"findings": string[], "hasCritical": boolean}.`,
                                allowedTools: ['Glob', 'Grep', 'Read'],
                            });
                findings.push(`Agent review: ${agentSummary.slice(0, 800)}`);
            }

            const hasCritical = findings.length > 0;
            return {
                agentName: this.name,
                status: hasCritical ? 'findings_found' : 'passed',
                summary: hasCritical
                    ? `Found ${findings.length} security concern(s).`
                    : 'No obvious security issues detected.',
            };
        } catch (err) {
            return {
                agentName: this.name,
                status: 'failed',
                summary: 'Security execution failed',
                errors: [err instanceof Error ? err.message : String(err)],
            };
        }
    }

    private async scanDirectory(dir: string, findings: string[]): Promise<void> {
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
                await this.scanDirectory(fullPath, findings);
                continue;
            }
            if (!entry.isFile()) continue;
            const text = await readFile(fullPath, 'utf-8').catch(() => null);
            if (!text) continue;
            for (const pattern of SENSITIVE_PATTERNS) {
                pattern.lastIndex = 0;
                const matches = text.match(pattern);
                if (matches) {
                    findings.push(`Possible secret in ${fullPath}: ${matches[0].slice(0, 80)}`);
                }
            }
        }
    }

    private async auditLockfiles(targetPath: string): Promise<string[]> {
        const out: string[] = [];
        const pkgPath = path.join(targetPath, 'package.json');
        const pkg = await readFile(pkgPath, 'utf-8').catch(() => null);
        if (!pkg) return out;
        const parsed = JSON.parse(pkg) as { dependencies?: Record<string, string> };
        if (!parsed.dependencies) return out;
        for (const [name, version] of Object.entries(parsed.dependencies)) {
            if (version.startsWith('^') && name !== name.toLowerCase().replace(/[^a-z0-9-]/g, '')) {
                out.push(`Suspicious dependency name: ${name}`);
            }
        }
        return out;
    }
}