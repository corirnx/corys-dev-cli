import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod/v3';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk/core';

const MODELS_URL = 'https://models.dev/models.json';
const USER_AGENT = 'corys-dev-cli/1.0.0';

interface RawModel {
    id: string;
    name: string;
    family: string;
    description?: string;
    reasoning?: boolean;
    tool_call?: boolean;
    structured_output?: boolean;
    open_weights?: boolean;
    release_date?: string;
    last_updated?: string;
    modalities?: { input?: string[]; output?: string[] };
    limit?: { context?: number; output?: number };
}

let cache: Record<string, RawModel> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchModels(): Promise<Record<string, RawModel>> {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL_MS) return cache;
    const res = await fetch(MODELS_URL, {
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`models.dev returned ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as Record<string, RawModel>;
    cache = data;
    cacheTime = now;
    return data;
}

function pickModelFields(model: RawModel) {
    return {
        id: model.id,
        name: model.name,
        family: model.family,
        description: model.description,
        contextWindow: model.limit?.context ?? null,
        outputLimit: model.limit?.output ?? null,
        modalities: model.modalities,
        reasoning: model.reasoning,
        toolCall: model.tool_call,
        structuredOutput: model.structured_output,
        openWeights: model.open_weights,
        releaseDate: model.release_date,
        lastUpdated: model.last_updated,
    };
}

const getModelSpecsTool = tool(
    'get_model_specs',
    'Return specifications for one or more model IDs from models.dev. If modelId is omitted, returns the full catalog.',
    z.object({
        modelId: z.string().optional().describe('Exact model ID (e.g. anthropic/claude-sonnet-4-5-20251022)'),
    }) as any,
    async ({ modelId }: { modelId?: string }) => {
        const models = await fetchModels();
        if (modelId) {
            const model = models[modelId];
            if (!model) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ found: false, modelId, availableIds: Object.keys(models).slice(0, 50) }),
                        },
                    ],
                };
            }
            return { content: [{ type: 'text', text: JSON.stringify(pickModelFields(model), null, 2) }] };
        }
        const summary = Object.values(models).map(pickModelFields);
        return {
            content: [
                { type: 'text', text: JSON.stringify({ count: summary.length, models: summary.slice(0, 20) }, null, 2) },
            ],
        };
    }
);

const searchModelsTool = tool(
    'search_models',
    'Search models.dev by family, capability, or keyword.',
    z.object({
        family: z.string().optional().describe('Model family name (e.g. claude, gpt, gemini)'),
        keyword: z.string().optional().describe('Keyword to match against name or description'),
        hasToolCall: z.boolean().optional(),
        hasReasoning: z.boolean().optional(),
        minContextWindow: z.number().optional(),
    }) as any,
    async ({ family, keyword, hasToolCall, hasReasoning, minContextWindow }: {
        family?: string;
        keyword?: string;
        hasToolCall?: boolean;
        hasReasoning?: boolean;
        minContextWindow?: number;
    }) => {
        const models = await fetchModels();
        const results = Object.values(models).filter((m) => {
            if (family && !String(m.family).toLowerCase().includes(family.toLowerCase())) return false;
            if (keyword) {
                const hay = `${m.name} ${m.description ?? ''}`.toLowerCase();
                if (!hay.includes(keyword.toLowerCase())) return false;
            }
            if (hasToolCall !== undefined && m.tool_call !== hasToolCall) return false;
            if (hasReasoning !== undefined && m.reasoning !== hasReasoning) return false;
            if (minContextWindow !== undefined && (m.limit?.context ?? 0) < minContextWindow) return false;
            return true;
        });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ count: results.length, models: results.map(pickModelFields) }, null, 2),
                },
            ],
        };
    }
);

const sdkServer = createSdkMcpServer({
    name: 'models-dev-server',
    version: '1.0.0',
    instructions:
        'Provides live model specifications from https://models.dev/models.json. Use get_model_specs for exact IDs and search_models for discovery.',
    tools: [getModelSpecsTool, searchModelsTool],
});

const transport = new StdioServerTransport();
await sdkServer.instance.connect(transport);
