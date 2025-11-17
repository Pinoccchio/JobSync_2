/**
 * Shared Logger Utility
 *
 * Logs appear in:
 * - Browser console (when called from client components)
 * - Terminal (when called from server components, API routes, middleware)
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

interface LogOptions {
  emoji?: string;
  data?: any;
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private getEmojiForLevel(level: LogLevel, customEmoji?: string): string {
    if (customEmoji) return customEmoji;

    const emojiMap: Record<LogLevel, string> = {
      info: 'ℹ️',
      success: '✅',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    };

    return emojiMap[level] || 'ℹ️';
  }

  private log(level: LogLevel, message: string, options: LogOptions = {}) {
    const emoji = this.getEmojiForLevel(level, options.emoji);
    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] ${emoji}`;

    // Determine if we're on server or client
    const isServer = typeof window === 'undefined';

    if (options.data) {
      if (isServer) {
        // Server-side: Log to terminal
        console.log(`${prefix} ${message}`, options.data);
      } else {
        // Client-side: Log to browser console
        console.log(`${prefix} ${message}`, options.data);
      }
    } else {
      if (isServer) {
        console.log(`${prefix} ${message}`);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }

    // For errors and warnings, use appropriate console methods
    if (level === 'error') {
      console.error(`${prefix} ${message}`, options.data || '');
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`, options.data || '');
    }
  }

  // Public methods
  info(message: string, data?: any) {
    this.log('info', message, { data });
  }

  success(message: string, data?: any) {
    this.log('success', message, { data });
  }

  warn(message: string, data?: any) {
    this.log('warn', message, { data });
  }

  error(message: string, data?: any) {
    this.log('error', message, { data });
  }

  debug(message: string, data?: any) {
    this.log('debug', message, { data });
  }

  // Custom emoji logging
  custom(emoji: string, message: string, data?: any) {
    this.log('info', message, { emoji, data });
  }

  // Authentication specific
  auth = {
    login: (message: string, data?: any) => this.log('info', message, { emoji: '🔐', data }),
    logout: (message: string, data?: any) => this.log('info', message, { emoji: '🚪', data }),
    register: (message: string, data?: any) => this.log('info', message, { emoji: '📝', data }),
    session: (message: string, data?: any) => this.log('info', message, { emoji: '🔑', data }),
  };

  // Database specific
  db = {
    query: (message: string, data?: any) => this.log('debug', message, { emoji: '🔍', data }),
    insert: (message: string, data?: any) => this.log('success', message, { emoji: '➕', data }),
    update: (message: string, data?: any) => this.log('info', message, { emoji: '✏️', data }),
    delete: (message: string, data?: any) => this.log('warn', message, { emoji: '🗑️', data }),
  };

  // API specific
  api = {
    request: (message: string, data?: any) => this.log('info', message, { emoji: '📡', data }),
    response: (message: string, data?: any) => this.log('success', message, { emoji: '📨', data }),
    error: (message: string, data?: any) => this.log('error', message, { emoji: '🚨', data }),
  };

  // Middleware specific
  middleware = {
    check: (message: string, data?: any) => this.log('info', message, { emoji: '🛡️', data }),
    allow: (message: string, data?: any) => this.log('success', message, { emoji: '✅', data }),
    deny: (message: string, data?: any) => this.log('warn', message, { emoji: '⛔', data }),
    redirect: (message: string, data?: any) => this.log('info', message, { emoji: '➡️', data }),
  };
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
