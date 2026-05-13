type Level = 'info' | 'warn' | 'error';

interface LogMeta {
  route?:  string;
  userId?: string;
  err?:    unknown;
  [key: string]: unknown;
}

function serialize(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  if (err !== undefined)    return String(err);
  return '';
}

function write(level: Level, message: string, meta: LogMeta = {}): void {
  const { err, ...rest } = meta;
  const parts: string[] = [
    `[${new Date().toISOString()}]`,
    `[${level.toUpperCase()}]`,
    message,
  ];
  if (Object.keys(rest).length) parts.push(JSON.stringify(rest));
  const errStr = serialize(err);
  if (errStr) parts.push(errStr);

  const line = parts.join(' ');
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info:  (message: string, meta?: LogMeta) => write('info',  message, meta),
  warn:  (message: string, meta?: LogMeta) => write('warn',  message, meta),
  error: (message: string, meta?: LogMeta) => write('error', message, meta),
};
