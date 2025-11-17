// Server-side Logger Formatter
// This file formats and prints logs to the terminal with colors

import { LogMessage, LogLevel, LogCategory } from './types';
import { categoryEmojis, levelEmojis } from './config';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

// Color mappings for log levels
const levelColors: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: colors.gray,
  [LogLevel.INFO]: colors.cyan,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.ERROR]: colors.red,
};

// Color mappings for categories
const categoryColors: Record<LogCategory, string> = {
  [LogCategory.AUTH]: colors.blue,
  [LogCategory.REALTIME]: colors.magenta,
  [LogCategory.API]: colors.green,
  [LogCategory.UI]: colors.cyan,
  [LogCategory.SYSTEM]: colors.yellow,
  [LogCategory.GENERAL]: colors.white,
};

/**
 * Format a timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');

  return `${colors.dim}${hours}:${minutes}:${seconds}.${ms}${colors.reset}`;
}

/**
 * Format a log level badge
 */
function formatLevel(level: LogLevel): string {
  const emoji = levelEmojis[level];
  const color = levelColors[level];
  const levelText = level.padEnd(5, ' ');

  return `${emoji} ${color}${levelText}${colors.reset}`;
}

/**
 * Format a category badge
 */
function formatCategory(category: LogCategory): string {
  const emoji = categoryEmojis[category];
  const color = categoryColors[category];
  const categoryText = category.padEnd(10, ' ');

  return `${emoji} ${color}${categoryText}${colors.reset}`;
}

/**
 * Format additional data
 */
function formatData(data: any): string {
  if (!data) return '';

  try {
    // Check if it's a simple object/array
    if (typeof data === 'object') {
      const json = JSON.stringify(data, null, 2);
      // Indent each line
      const indented = json.split('\n').map(line => `    ${colors.dim}${line}${colors.reset}`).join('\n');
      return `\n${indented}`;
    }

    return `${colors.dim} ${data}${colors.reset}`;
  } catch (error) {
    return `${colors.dim} [Unable to format data]${colors.reset}`;
  }
}

/**
 * Format a stack trace
 */
function formatStack(stack: string): string {
  if (!stack) return '';

  const lines = stack.split('\n').slice(1, 4); // First 3 stack frames
  const formatted = lines.map(line => {
    return `    ${colors.red}${colors.dim}${line.trim()}${colors.reset}`;
  }).join('\n');

  return `\n${formatted}`;
}

/**
 * Format and print a single log message to terminal
 */
export function formatLogMessage(log: LogMessage): void {
  const timestamp = formatTimestamp(log.timestamp);
  const level = formatLevel(log.level);
  const category = formatCategory(log.category);
  const message = log.message;
  const data = formatData(log.data);
  const stack = formatStack(log.stack);

  // Construct the final log line
  const logLine = `${timestamp} ${level} ${category} ${message}${data}${stack}`;

  // Print to console
  console.log(logLine);
}

/**
 * Format and print multiple log messages
 */
export function formatLogBatch(logs: LogMessage[]): void {
  if (logs.length === 0) return;

  // Print separator for batch
  console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
  console.log(`${colors.dim}📦 Batch of ${logs.length} log(s)${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}\n`);

  logs.forEach(log => formatLogMessage(log));

  console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}\n`);
}
