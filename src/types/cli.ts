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

/**
 * Metadata describing an audit run, used to enrich generated reports.
 */
export interface ReportMeta {
    targetPath: string;
    targetDir: string;
    gitBranch?: string;
    gitCommit?: string;
    subagents: string[];
    offline: boolean;
    dryRun: boolean;
    /** Duration in milliseconds for each subagent by agent name. */
    durationsMs: Record<string, number>;
}