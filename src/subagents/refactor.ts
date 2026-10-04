import { BaseSubagent } from './base.js';
import { AgentContext, SubagentResult, CodeRewriteProposal } from '../types/agent.js';
import { queryAgent } from '../orchestrator/agent-sdk.js';

export class RefactorAgent extends BaseSubagent {
    readonly name = 'Refactor' as const;

    async run(context: AgentContext): Promise<SubagentResult> {
        try {
            if (context.offline) {
                return {
                    agentName: this.name,
                    status: 'passed',
                    summary: 'Offline mode: skipping LLM refactoring analysis.',
                };
            }

            const rawResult = await queryAgent({
                prompt: `Analyze source files under ${context.targetPath}/src for legacy code patterns such as callbacks/raw promise chains, missing error handling, or verbose repetition. If refactoring is required, return JSON: {"proposals": [{"filePath": string, "originalCode": string, "proposedCode": string, "reasoning": string}]}. If nothing needs changing, return {"proposals": []}.`,
                cwd: context.targetPath,
                allowedTools: ['Glob', 'Grep', 'Read'],
            });

            let proposals: CodeRewriteProposal[] = [];
            try {
                const parsed = JSON.parse(rawResult);
                if (Array.isArray(parsed.proposals)) {
                    proposals = parsed.proposals.slice(0, 10);
                }
            } catch {
                // Output was non-JSON formatted summary
            }

            return {
                agentName: this.name,
                status: proposals.length > 0 ? 'findings_found' : 'passed',
                summary: proposals.length > 0
                    ? `Proposed refactoring for ${proposals.length} file(s).`
                    : 'No significant refactoring opportunities detected.',
                proposals,
            };
        } catch (err) {
            return {
                agentName: this.name,
                status: 'failed',
                summary: 'Refactoring agent failed',
                errors: [err instanceof Error ? err.message : String(err)],
            };
        }
    }
}