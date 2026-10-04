import { AgentContext, SubagentResult } from '../types/agent.js';

export abstract class BaseSubagent {
    abstract readonly name: 'Security' | 'DependencyAudit' | 'Refactor';

    abstract run(context: AgentContext): Promise<SubagentResult>;
}