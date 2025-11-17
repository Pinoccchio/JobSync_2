/**
 * Gemini AI Client Exports
 *
 * Usage guide:
 * - Use these functions ONLY in server-side code (API routes, Server Actions, Server Components)
 * - NEVER expose the Gemini API key to the browser
 *
 * Example usage in an API route:
 * ```typescript
 * import { generateContent, parseGeminiJSON } from '@/lib/gemini';
 *
 * const response = await generateContent(prompt);
 * const data = parseGeminiJSON<ScoreResponse>(response);
 * ```
 */

export {
  createGeminiClient,
  getGeminiModel,
  generateContent,
  parseGeminiJSON,
} from './client';

export { GEMINI_CONFIG, RANKING_PROMPTS } from './config';
