// Logger Type Definitions

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogCategory {
  AUTH = 'AUTH',
  REALTIME = 'REALTIME',
  API = 'API',
  UI = 'UI',
  SYSTEM = 'SYSTEM',
  GENERAL = 'GENERAL',
}

export interface LogMessage {
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

export interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  categories: LogCategory[];
  batchSize: number;
  batchInterval: number;
}
