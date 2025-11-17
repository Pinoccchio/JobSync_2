import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from './config';

/**
 * Initialize Gemini AI client
 * This should only be used server-side to protect the API key
 */
export function createGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Get a configured Gemini model instance
 * @param modelName - Optional model name override (defaults to config)
 */
export function getGeminiModel(modelName?: string) {
  const genAI = createGeminiClient();
  return genAI.getGenerativeModel({
    model: modelName || GEMINI_CONFIG.model,
    generationConfig: GEMINI_CONFIG.generationConfig,
    safetySettings: GEMINI_CONFIG.safetySettings,
  });
}

/**
 * Helper function to generate content with error handling
 * @param prompt - The prompt to send to Gemini
 * @param modelName - Optional model name override
 */
export async function generateContent(prompt: string, modelName?: string) {
  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI Error:', error);
    throw new Error('Failed to generate content from Gemini AI');
  }
}

/**
 * Helper function to parse JSON responses from Gemini
 * Gemini sometimes wraps JSON in markdown code blocks
 */
export function parseGeminiJSON<T>(text: string): T {
  try {
    // Remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse Gemini JSON response:', text);
    throw new Error('Invalid JSON response from Gemini AI');
  }
}
