import { z } from 'zod';
import { callAi, type AiRequestOptions } from './provider';

/**
 * Calls the AI with a prompt that returns JSON, parses and validates with Zod.
 * Retries once if the output is invalid.
 */
export async function callAiJson<T>(
  schema: z.ZodType<T>,
  prompt: string,
  options: AiRequestOptions & { systemPrompt?: string } = {}
): Promise<{ data: T; tokensUsed: number; model: string }> {
  const systemPrompt =
    options.systemPrompt ??
    'You are a precise JSON extraction assistant. Always respond with valid JSON only. No markdown code blocks, no explanations, no preamble. Just the raw JSON object.';

  async function attempt(): Promise<{ data: T; tokensUsed: number; model: string }> {
    const response = await callAi(
      [{ role: 'user', content: prompt }],
      { ...options, systemPrompt }
    );

    let raw = response.content.trim();

    // Strip markdown code blocks if present
    if (raw.startsWith('```json')) {
      raw = raw.slice(7);
      if (raw.endsWith('```')) raw = raw.slice(0, -3);
    } else if (raw.startsWith('```')) {
      raw = raw.slice(3);
      if (raw.endsWith('```')) raw = raw.slice(0, -3);
    }
    raw = raw.trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`AI returned invalid JSON: ${raw.slice(0, 200)}`);
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`AI JSON schema validation failed: ${result.error.message}`);
    }

    return {
      data: result.data,
      tokensUsed: response.tokensUsed,
      model: response.model,
    };
  }

  try {
    return await attempt();
  } catch (firstError) {
    // Retry once with explicit instruction to fix
    try {
      const retryPrompt = `${prompt}\n\nIMPORTANT: The previous response was invalid. You MUST return ONLY a raw JSON object. No markdown, no explanation, just JSON.`;
      const response = await callAi(
        [{ role: 'user', content: retryPrompt }],
        { ...options, systemPrompt }
      );

      let raw = response.content.trim();
      if (raw.startsWith('```json')) raw = raw.slice(7);
      else if (raw.startsWith('```')) raw = raw.slice(3);
      if (raw.endsWith('```')) raw = raw.slice(0, -3);
      raw = raw.trim();

      const parsed = JSON.parse(raw);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`AI retry also failed validation: ${result.error.message}`);
      }

      return {
        data: result.data,
        tokensUsed: response.tokensUsed,
        model: response.model,
      };
    } catch (retryError) {
      throw new Error(
        `AI JSON parsing failed after retry. First error: ${firstError}. Retry error: ${retryError}`
      );
    }
  }
}
