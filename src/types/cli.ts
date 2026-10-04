export type SubagentType = 'security' | 'deps' | 'refactor' | 'all';

export interface CheckCommandOptions {
  subagents: SubagentType[];
  verbose: boolean;
  dryRun: boolean;
  autoApprove: boolean;
}

export interface ExecutionContext {
  targetDir: string;
  absolutePath: string;
  options: CheckCommandOptions;
}