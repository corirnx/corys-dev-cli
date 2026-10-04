export interface CodeRewriteProposal {
    filePath: string;
    originalCode: string;
    proposedCode: string;
    reasoning: string;
}

export interface SubagentResult {
    agentName: 'Security' | 'DependencyAudit' | 'Refactor';
    status: 'passed' | 'findings_found' | 'failed';
    summary: string;
    proposals?: CodeRewriteProposal[];
    errors?: string[];
}

export interface AgentContext {
    targetPath: string;
    dryRun: boolean;
    verbose: boolean;
    offline: boolean;
}