export type SubagentType = 'security' | 'deps' | 'refactor' | 'all';

export type ReportFormat = 'markdown' | 'json' | 'html';

export interface CheckCommandOptions {
    subagents: SubagentType[];
    dryRun: boolean;
    autoApprove: boolean;
    offline: boolean;
    format?: ReportFormat;
    output?: string;
}

export interface ExecutionContext {
    targetDir: string;
    absolutePath: string;
    options: CheckCommandOptions;
}