/**
 * Provider-agnostic AI wrapper.
 * Set AI_PROVIDER=claude (default) or AI_PROVIDER=gemini
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AiProvider = 'claude' | 'gemini';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  imageBase64?: string;  // for vision requests
  imageMimeType?: string;
}

export interface AiResponse {
  content: string;
  tokensUsed: number;
  model: string;
  provider: AiProvider;
}

let claudeClient: Anthropic | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return claudeClient;
}

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  }
  return geminiClient;
}

export function getActiveProvider(): AiProvider {
  return (process.env.AI_PROVIDER as AiProvider) ?? 'claude';
}

export async function callAi(
  messages: AiMessage[],
  options: AiRequestOptions = {}
): Promise<AiResponse> {
  const provider = getActiveProvider();

  if (provider === 'gemini') {
    return callGemini(messages, options);
  }
  return callClaude(messages, options);
}

async function callClaude(
  messages: AiMessage[],
  options: AiRequestOptions
): Promise<AiResponse> {
  const client = getClaudeClient();
  const model = options.model ?? 'claude-3-5-sonnet-20241022';

  // Build content blocks for vision if image provided
  const processedMessages = messages.map((msg) => {
    if (msg.role === 'user' && options.imageBase64) {
      return {
        role: 'user' as const,
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: (options.imageMimeType ?? 'image/jpeg') as
                | 'image/jpeg'
                | 'image/png'
                | 'image/gif'
                | 'image/webp',
              data: options.imageBase64,
            },
          },
          { type: 'text' as const, text: msg.content },
        ],
      };
    }
    return { role: msg.role, content: msg.content };
  });

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.3,
    system: options.systemPrompt,
    messages: processedMessages,
  });

  const content = response.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('');

  return {
    content,
    tokensUsed: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
    model,
    provider: 'claude',
  };
}

async function callGemini(
  messages: AiMessage[],
  options: AiRequestOptions
): Promise<AiResponse> {
  const client = getGeminiClient();
  const modelName = options.model ?? 'gemini-1.5-flash';
  const model = client.getGenerativeModel({ model: modelName });

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (options.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: options.imageMimeType ?? 'image/jpeg',
        data: options.imageBase64,
      },
    });
  }

  // Combine all user messages
  for (const msg of messages) {
    parts.push({ text: msg.content });
  }

  const systemInstruction = options.systemPrompt ?? '';
  const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${parts.map(p => p.text ?? '').join('\n')}` : parts.map(p => p.text ?? '').join('\n');

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: options.imageBase64
      ? [
          { inlineData: { mimeType: options.imageMimeType ?? 'image/jpeg', data: options.imageBase64 } },
          { text: fullPrompt }
        ]
      : [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  });

  const content = result.response.text();
  const usage = result.response.usageMetadata;

  return {
    content,
    tokensUsed: (usage?.totalTokenCount ?? 0),
    model: modelName,
    provider: 'gemini',
  };
}
