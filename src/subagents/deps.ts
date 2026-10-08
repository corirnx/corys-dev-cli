import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BaseSubagent } from './base.js';
import { AgentContext, SubagentResult, Finding } from '../types/agent.js';
import { summarizeRisk } from '../utils/risk.js';

export class DependencyAuditAgent extends BaseSubagent {
    readonly name = 'DependencyAudit' as const;

    async run(context: AgentContext): Promise<SubagentResult> {
        const findings: Finding[] = [];
        try {
            const pkgPath = path.join(context.targetPath, 'package.json');
            const pkgText = await readFile(pkgPath, 'utf-8').catch(() => null);
            const pkg = pkgText ? (JSON.parse(pkgText) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }) : undefined;

            const depGroups: Record<string, Record<string, string>> = {};
            if (pkg?.dependencies) depGroups.dependencies = pkg.dependencies;
            if (pkg?.devDependencies) depGroups.devDependencies = pkg.devDependencies;

            for (const [group, deps] of Object.entries(depGroups)) {
                for (const [name, version] of Object.entries(deps)) {
                    const finding = this.classifyDependencyVersion(name, version, group);
                    if (finding) findings.push(finding);
                }
            }

            if (!context.offline) {
                const modelIds = this.extractModelIds(pkgText ?? '');
                const agentSummary = await this.queryAgentWithIgnore(context, {
                    prompt: `Audit dependencies and LLM model IDs in ${context.targetPath}. Known model IDs in codebase: ${modelIds.join(', ') || 'none'}. Use the models-dev MCP server get_model_specs tool to verify each model ID and flag deprecated or unknown ones. Inspect package.json for outdated or suspicious packages. Return a concise JSON summary: {"findings": string[], "recommendations": string[]}.`,
                    allowedTools: ['Read', 'Glob', 'Grep'],
                });
                this.pushAgentReview(findings, agentSummary);
            }

            const hasFindings = findings.length > 0;
            return {
                agentName: this.name,
                status: hasFindings ? 'findings_found' : 'passed',
                summary: hasFindings
                    ? `Found ${findings.length} dependency/model concern(s).`
                    : 'Dependencies and model references look clean.',
                riskSummary: summarizeRisk(findings),
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

    private classifyDependencyVersion(name: string, version: string, group: string): Finding | null {
        const groupLabel = group === 'devDependencies' ? 'dev dependency' : 'dependency';
        if (version.includes('*') || version.includes('latest') || version.includes('workspace:')) {
            return {
                type: 'dependency',
                severity: 'medium',
                message: `Floating ${groupLabel} version for ${name}: ${version} (unbound — may change unexpectedly)`,
                location: 'package.json',
            };
        }
        if (version.startsWith('^') || version.startsWith('~')) {
            return {
                type: 'dependency',
                severity: 'low',
                message: `Loose ${groupLabel} range for ${name}: ${version} (consider pinning the exact version)`,
                location: 'package.json',
            };
        }
        return null;
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