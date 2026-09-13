const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * AI Service Abstraction
 * -----------------------
 * Every other part of the codebase talks to `aiService.complete()` /
 * `aiService.completeJSON()` only. Swapping providers (Anthropic, OpenAI,
 * local model, etc.) means editing ONLY this file.
 *
 * If AI_API_KEY is not configured, the service falls back to a deterministic
 * mock so the rest of the product (ATS scoring pipeline, interview prep UI,
 * etc.) remains fully runnable in local/demo environments without a key.
 */

const PROVIDERS = {
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    async call(prompt, { maxTokens = 1024 } = {}) {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.aiApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: env.aiModel,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI provider error (${response.status}): ${text}`);
      }

      const data = await response.json();
      const textBlock = (data.content || []).find((block) => block.type === 'text');
      return textBlock ? textBlock.text : '';
    },
  },
  // Add additional providers here (openai, azure, local-llm, ...) implementing
  // the same `call(prompt, options)` -> string contract.
};

function isConfigured() {
  return Boolean(env.aiApiKey);
}

/**
 * Sends a prompt and returns raw text.
 */
async function complete(prompt, options = {}) {
  if (!isConfigured()) {
    logger.warn('AI_API_KEY not set - returning mock AI response');
    return mockResponse(prompt);
  }

  const provider = PROVIDERS[env.aiProvider];
  if (!provider) throw new Error(`Unknown AI provider: ${env.aiProvider}`);

  try {
    return await provider.call(prompt, options);
  } catch (err) {
    logger.error('AI provider call failed', { error: err.message });
    throw err;
  }
}

/**
 * Sends a prompt that instructs the model to return ONLY JSON, and parses it.
 * Falls back gracefully to `fallback` if parsing fails.
 */
async function completeJSON(prompt, fallback = {}) {
  const strictPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown fences, no preamble, no explanation.`;
  const raw = await complete(strictPrompt, { maxTokens: 2048 });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.warn('Failed to parse AI JSON response, using fallback', { error: err.message });
    return fallback;
  }
}

/**
 * Deterministic mock so the product works end-to-end without an API key.
 * Only used when AI_API_KEY is empty.
 */
function mockResponse(prompt) {
  if (/JSON/i.test(prompt) || /json/.test(prompt)) {
    return JSON.stringify({
      note: 'AI_API_KEY is not configured. This is a placeholder response - set AI_API_KEY in .env to enable real AI analysis.',
    });
  }
  return 'AI_API_KEY is not configured. Set it in your .env file to enable real AI-generated content.';
}

module.exports = { complete, completeJSON, isConfigured };
