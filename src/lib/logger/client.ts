'use client';

// Client-side Logger
// Intercepts console methods and sends logs to server via API

import { LogMessage, LogLevel, LogCategory } from './types';
import { loggerConfig, categoryPatterns } from './config';

class ClientLogger {
  private logBuffer: LogMessage[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  /**
   * Auto-detect category based on message content
   */
  private detectCategory(message: string): LogCategory {
    const msgLower = message.toLowerCase();

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(msgLower)) {
          return category as LogCategory;
        }
      }
    }

    return LogCategory.GENERAL;
  }

  /**
   * Convert console arguments to a message string
   */
  private argsToMessage(args: any[]): { message: string; data?: any } {
    if (args.length === 0) return { message: '' };

    // First arg is the message
    const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);

    // Rest are data
    const data = args.length > 1 ? args.slice(1) : undefined;

    return { message, data };
  }

  /**
   * Create a log message
   */
  private createLogMessage(
    level: LogLevel,
    args: any[],
    stack?: string
  ): LogMessage {
    const { message, data } = this.argsToMessage(args);
    const category = this.detectCategory(message);

    return {
      level,
      category,
      message,
      timestamp: new Date().toISOString(),
      data,
      stack,
    };
  }

  /**
   * Add log to buffer and schedule batch send
   */
  private addToBuffer(log: LogMessage): void {
    this.logBuffer.push(log);

    // Send immediately if buffer is full
    if (this.logBuffer.length >= loggerConfig.batchSize) {
      this.sendBatch();
      return;
    }

    // Otherwise, schedule a batch send
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.sendBatch();
      }, loggerConfig.batchInterval);
    }
  }

  /**
   * Send batch of logs to server
   */
  private async sendBatch(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Get logs to send
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      // Silently fail - don't create infinite loop
      this.originalConsole.error('Failed to send logs to server:', error);
    }
  }

  /**
   * Intercept console.log
   */
  private interceptLog = (...args: any[]): void => {
    this.originalConsole.log(...args);

    if (loggerConfig.enabled) {
      const log = this.createLogMessage(LogLevel.INFO, args);
      this.addToBuffer(log);
    }
  };

  /**
   * Intercept console.info
   */
  private interceptInfo = (...args: any[]): void => {
    this.originalConsole.info(...args);

    if (loggerConfig.enabled) {
      const log = this.createLogMessage(LogLevel.INFO, args);
      this.addToBuffer(log);
    }
  };

  /**
   * Intercept console.warn
   */
  private interceptWarn = (...args: any[]): void => {
    this.originalConsole.warn(...args);

    if (loggerConfig.enabled) {
      const log = this.createLogMessage(LogLevel.WARN, args);
      this.addToBuffer(log);
    }
  };

  /**
   * Intercept console.error
   */
  private interceptError = (...args: any[]): void => {
    this.originalConsole.error(...args);

    if (loggerConfig.enabled) {
      // Try to extract stack trace if available
      let stack: string | undefined;
      if (args[0] instanceof Error) {
        stack = args[0].stack;
      }

      const log = this.createLogMessage(LogLevel.ERROR, args, stack);
      this.addToBuffer(log);
    }
  };

  /**
   * Intercept console.debug
   */
  private interceptDebug = (...args: any[]): void => {
    this.originalConsole.debug(...args);

    if (loggerConfig.enabled) {
      const log = this.createLogMessage(LogLevel.DEBUG, args);
      this.addToBuffer(log);
    }
  };

  /**
   * Initialize the logger by intercepting console methods
   */
  public init(): void {
    if (!loggerConfig.enabled) {
      this.originalConsole.info('Logger is disabled (production mode)');
      return;
    }

    console.log = this.interceptLog;
    console.info = this.interceptInfo;
    console.warn = this.interceptWarn;
    console.error = this.interceptError;
    console.debug = this.interceptDebug;

    this.originalConsole.info('✅ Client logger initialized - all console logs will be sent to terminal');
  }

  /**
   * Restore original console methods
   */
  public destroy(): void {
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    // Send any remaining logs
    this.sendBatch();
  }
}

// Singleton instance
export const clientLogger = new ClientLogger();
