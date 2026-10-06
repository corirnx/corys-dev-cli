import dotenv from 'dotenv';
import path from 'node:path';

export function loadAndMapEnvironment(cwd: string = process.cwd()): void {
    // Silence dotenvx "injected env" banner before loading .env
    process.env.DOTENV_QUIET = process.env.DOTENV_QUIET ?? 'true';
    // Load .env from current working directory or fall back to system env
    dotenv.config({ path: path.resolve(cwd, '.env') });

    const provider = (process.env.PROVIDER_NAME || 'anthropic').toLowerCase();
    const apiKey = process.env.MODEL_PROVIDER_KEY || process.env.ANTHROPIC_API_KEY || '';
    const baseUrl = process.env.MODEL_PROVIDER_URL;
    const modelName = process.env.MODEL_NAME;

    switch (provider) {
        case 'openrouter':
            // OpenRouter mapping for Anthropic SDK compatibility
            process.env.ANTHROPIC_BASE_URL = baseUrl || 'https://openrouter.ai/api';
            process.env.ANTHROPIC_AUTH_TOKEN = apiKey;
            process.env.ANTHROPIC_API_KEY = ''; // Clear standard key so SDK relies on auth token
            if (modelName) process.env.ANTHROPIC_MODEL = modelName;
            break;

        case 'anthropic':
            // Native Anthropic configuration
            if (baseUrl) process.env.ANTHROPIC_BASE_URL = baseUrl;
            process.env.ANTHROPIC_API_KEY = apiKey;
            if (modelName) process.env.ANTHROPIC_MODEL = modelName;
            break;

        case 'vertexai':
            // Google Vertex AI mapping
            process.env.CLAUDE_CODE_USE_VERTEX = '1';
            if (apiKey) process.env.ANTHROPIC_API_KEY = apiKey;
            if (baseUrl) process.env.ANTHROPIC_BASE_URL = baseUrl;
            if (modelName) process.env.ANTHROPIC_MODEL = modelName;
            break;

        case 'custom':
            // Generic OpenAI-compatible / LiteLLM / Ollama proxy
            if (baseUrl) process.env.ANTHROPIC_BASE_URL = baseUrl;
            process.env.ANTHROPIC_AUTH_TOKEN = apiKey;
            process.env.ANTHROPIC_API_KEY = '';
            if (modelName) process.env.ANTHROPIC_MODEL = modelName;
            break;

        default: {
            const valid = ['anthropic', 'openrouter', 'vertexai', 'custom'];
            console.warn(
                `[WARN] Unknown PROVIDER_NAME "${provider}". ` +
                `Valid values are: ${valid.join(', ')}. ` +
                `Falling back to anthropic configuration.`
            );
            if (baseUrl) process.env.ANTHROPIC_BASE_URL = baseUrl;
            process.env.ANTHROPIC_API_KEY = apiKey;
            if (modelName) process.env.ANTHROPIC_MODEL = modelName;
            break;
        }
    }
}