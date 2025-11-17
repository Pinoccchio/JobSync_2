// Logger Configuration

import { LogLevel, LogCategory, LoggerConfig } from './types';

export const loggerConfig: LoggerConfig = {
  // Only enabled in development
  enabled: process.env.NODE_ENV === 'development',

  // Minimum log level to display
  minLevel: LogLevel.DEBUG,

  // Categories to display (empty array = all)
  categories: [],

  // Batch settings
  batchSize: 10,          // Send after 10 logs
  batchInterval: 500,     // Or after 500ms
};

// Category detection patterns
export const categoryPatterns: Record<string, RegExp[]> = {
  [LogCategory.AUTH]: [
    /login/i,
    /logout/i,
    /auth/i,
    /session/i,
    /sign(in|up|out)/i,
    /password/i,
    /credentials/i,
  ],
  [LogCategory.REALTIME]: [
    /subscription/i,
    /real-?time/i,
    /supabase.*channel/i,
    /broadcast/i,
    /presence/i,
  ],
  [LogCategory.API]: [
    /api/i,
    /fetch/i,
    /request/i,
    /response/i,
    /endpoint/i,
    /\b(GET|POST|PUT|PATCH|DELETE)\b/,
  ],
  [LogCategory.UI]: [
    /render/i,
    /component/i,
    /click/i,
    /modal/i,
    /toast/i,
    /navigation/i,
  ],
  [LogCategory.SYSTEM]: [
    /error/i,
    /warning/i,
    /failed/i,
    /success/i,
    /initialized/i,
  ],
};

// Emoji mappings for categories
export const categoryEmojis: Record<LogCategory, string> = {
  [LogCategory.AUTH]: '🔐',
  [LogCategory.REALTIME]: '🔄',
  [LogCategory.API]: '🌐',
  [LogCategory.UI]: '🎨',
  [LogCategory.SYSTEM]: '⚙️',
  [LogCategory.GENERAL]: '📝',
};

// Emoji mappings for log levels
export const levelEmojis: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '🐛',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌',
};
