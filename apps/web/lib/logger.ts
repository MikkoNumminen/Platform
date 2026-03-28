type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  error?: unknown;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  const prefix = entry.context ? `[${entry.context}]` : "";
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${prefix} ${entry.message}`.trim();
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: string,
  error?: unknown,
): LogEntry {
  return {
    level,
    message,
    context,
    error,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  info(message: string, context?: string) {
    const entry = createLogEntry("info", message, context);
    console.log(formatLog(entry));
  },

  warn(message: string, context?: string) {
    const entry = createLogEntry("warn", message, context);
    console.warn(formatLog(entry));
  },

  error(message: string, error?: unknown, context?: string) {
    const entry = createLogEntry("error", message, context, error);
    console.error(formatLog(entry), error instanceof Error ? error.stack : error);
  },
};
