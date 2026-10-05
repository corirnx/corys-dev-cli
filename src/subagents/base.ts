import { unlink, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AgentContext, SubagentResult } from '../types/agent.js';
import { buildCombinedIgnoreDocument } from '../utils/ignore.js';
import { queryAgent, QueryAgentOptions } from '../orchestrator/agent-sdk.js';

// use .ignore file to e.g. ignore build dirs to reduce token usage
const TEMP_IGNORE_FILENAME = '.ignore';


export abstract class BaseSubagent {
    abstract readonly name: 'Security' | 'DependencyAudit' | 'Refactor';
    abstract run(context: AgentContext): Promise<SubagentResult>;

    /**
     * Run a Claude Agent SDK query with the target repository's ignore rules
     * (built-in defaults + `.gitignore` + `.corysignore`) applied to the tool
     * agents. This writes a temporary `.ignore` file into the session working
     * directory for the duration of the query and removes it afterwards.
     */
    protected async queryAgentWithIgnore(context: AgentContext, options: Omit<QueryAgentOptions, 'cwd'>): Promise<string> {
        const cwd = context.targetPath;
        const ignorePath = path.join(cwd, TEMP_IGNORE_FILENAME);

        const originalContent = await readFile(ignorePath, 'utf-8').catch(() => null);
        const content = await buildCombinedIgnoreDocument(cwd);
        await writeFile(ignorePath, content, 'utf-8');

        try {
            return await queryAgent({ ...options, cwd });
        } finally {
            if (originalContent !== null) {
                await writeFile(ignorePath, originalContent, 'utf-8');
            } else {
                await unlink(ignorePath).catch(() => undefined);
            }
        }
    }
}
