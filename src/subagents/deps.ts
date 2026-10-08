import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BaseSubagent } from './base.js';
import { AgentContext, SubagentResult, Finding } from '../types/agent.js';

export class DependencyAuditAgent extends BaseSubagent {
    readonly name = 'DependencyAudit' as const;

    async run(context: AgentContext): Promise<SubagentResult> {
        const findings: Finding[] = [];
        try {
            const pkgPath = path.join(context.targetPath, 'package.json');
            const pkgText = await readFile(pkgPath, 'utf-8').catch(() => null);
            const pkg = pkgText ? (JSON.parse(pkgText) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }) : undefined;

            if (pkg?.dependencies) {
                for (const [name, version] of Object.entries(pkg.dependencies)) {
                    if (version.includes('*') || version.includes('latest') || version.includes('workspace:')) {
                        findings.push({
                            type: 'dependency',
                            severity: 'low',
                            message: `Loose dependency version for ${name}: ${version}`,
                            location: 'package.json',
                        });
                    }
                }
            }

            if (!context.offline) {
                const modelIds = this.extractModelIds(pkgText ?? '');
                const agentSummary = await this.queryAgentWithIgnore(context, {
                    prompt: `Audit dependencies and LLM model IDs in ${context.targetPath}. Known model IDs in codebase: ${modelIds.join(', ') || 'none'}. Use the models-dev MCP server get_model_specs tool to verify each model ID and flag deprecated or unknown ones. Inspect package.json for outdated or suspicious packages. Return a concise JSON summary: {"findings": string[], "recommendations": string[]}.`,
                    allowedTools: ['Read', 'Glob', 'Grep'],
                });
                const review = agentSummary.trim();
                if (review) {
                    findings.push({ type: 'agent-review', severity: 'medium', message: `Agent review: ${review.slice(0, 800)}` });
                }
            }

            const hasFindings = findings.length > 0;
            return {
                agentName: this.name,
                status: hasFindings ? 'findings_found' : 'passed',
                summary: hasFindings
                    ? `Found ${findings.length} dependency/model concern(s).`
                    : 'Dependencies and model references look clean.',
                findings: findings.length > 0 ? findings : undefined,
            };
        } catch (err) {
            return {
                agentName: this.name,
                status: 'failed',
                summary: 'Dependency audit execution failed',
                errors: [err instanceof Error ? err.message : String(err)],
            };
        }
    }

    private extractModelIds(pkgText: string): string[] {
        const ids = new Set<string>();
        const pattern = /['"](?:claude|gpt|gemini|sonnet|opus|haiku)[a-z0-9-/.]*['"]/gi;
        const matches = pkgText.match(pattern) ?? [];
        for (const m of matches) {
            ids.add(m.replace(/['"]/g, ''));
        }
        return Array.from(ids);
    }
}