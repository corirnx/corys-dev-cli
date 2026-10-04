import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '@anthropic-ai/claude-agent-sdk/core';
import type { McpStdioServerConfig } from '@anthropic-ai/claude-agent-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

export interface QueryAgentOptions {
    prompt: string;
    cwd: string;
    allowedTools: string[];
    useMcpModelsServer?: boolean;
}

export async function queryAgent(options: QueryAgentOptions): Promise<string> {
    const mcpServers: Record<string, McpStdioServerConfig> = {};
    if (options.useMcpModelsServer !== false) {
        mcpServers['models-dev'] = {
            type: 'stdio',
            command: 'node',
            args: [path.join(ROOT, 'dist/mcp/models-server.js')],
            alwaysLoad: true,
        };
    }

    let outputText = '';
    const stream = query({
        prompt: options.prompt,
        options: {
            cwd: options.cwd,
            allowedTools: options.allowedTools,
            permissionMode: 'auto',
            mcpServers,
        },
    });

    for await (const message of stream) {
        const msg = message as Record<string, unknown>;
        if (typeof msg.result === 'string') {
            outputText += msg.result;
        } else if (typeof msg.text === 'string') {
            outputText += msg.text;
        }
    }

    return outputText;
}
