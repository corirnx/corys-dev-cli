export interface CodeRewriteProposal {
    filePath: string;
    originalCode: string;
    proposedCode: string;
    reasoning: string;
}

export type FindingSeverity = 'high' | 'medium' | 'low';

export interface Finding {
    type: string;
    severity: FindingSeverity;
    message: string;
    location?: string;
}

export interface SubagentResult {
    agentName: 'Security' | 'DependencyAudit' | 'Refactor';
    status: 'passed' | 'findings_found' | 'failed';
    summary: string;
    proposals?: CodeRewriteProposal[];
    findings?: Finding[];
    errors?: string[];
}

export interface AgentContext {
    targetPath: string;
    offline: boolean;
}