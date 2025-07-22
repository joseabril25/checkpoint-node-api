// src/common/utils/logger.ts
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    return LogLevel[level as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private writeToFile(level: string, message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    const combinedLogFile = path.join(this.logDir, 'combined.log');
    
    fs.appendFileSync(logFile, formattedMessage + '\n');
    fs.appendFileSync(combinedLogFile, formattedMessage + '\n');
  }

  private log(level: LogLevel, levelName: string, color: typeof chalk, message: string, meta?: any): void {
    if (level > this.logLevel) return;

    const timestamp = chalk.gray(new Date().toISOString());
    const levelStr = color(levelName.padEnd(5));
    const formattedMessage = `${timestamp} ${levelStr} ${message}`;
    
    console.log(formattedMessage);
    if (meta) {
      console.log(chalk.gray(JSON.stringify(meta, null, 2)));
    }

    // Write to file (no colors)
    this.writeToFile(levelName, message, meta);
  }

  error(message: string, error?: Error | any): void {
    const meta = error instanceof Error ? { 
      name: error.name,
      message: error.message,
      stack: error.stack 
    } : error;
    
    this.log(LogLevel.ERROR, 'ERROR', chalk.red, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, 'WARN', chalk.yellow, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, 'INFO', chalk.green, message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', chalk.blue, message, meta);
  }

  // For HTTP logging with Morgan
  http(message: string): void {
    this.log(LogLevel.INFO, 'HTTP', chalk.magenta, message.trim());
  }
}

// Export singleton instance
const logger = new Logger();

// Export stream for Morgan
export const stream = {
  write: (message: string) => logger.http(message),
};

export default logger;