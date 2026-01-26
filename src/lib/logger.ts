/**
 * Logger Service
 * Environment-aware logging with severity levels and optional call site tracking
 *
 * Levels: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
 * - Development (localhost): Enabled by default, outputLevel=0 (DEBUG)
 * - Production: Disabled by default, outputLevel=2 (WARN)
 */

const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevel = (typeof LEVELS)[keyof typeof LEVELS];

// Auto-configure based on environment
const isDev =
  typeof window !== 'undefined' && window.location?.hostname === 'localhost';

// Private state
let isLogging = isDev;
let outputLevel: LogLevel = isDev ? LEVELS.DEBUG : LEVELS.WARN;
let showCallSites = isDev;
let callSiteLevel: LogLevel = isDev ? LEVELS.DEBUG : LEVELS.WARN;

/**
 * Get the call site (file:line) of the log call
 */
function getCallSite(): string {
  try {
    const err = new Error();
    const stack = err.stack?.split('\n');
    if (!stack || stack.length < 5) return '';

    // Stack trace format varies by browser, typically:
    // 0: "Error"
    // 1: getCallSite (this function)
    // 2: log (the log function)
    // 3: debug/info/warn/error (the convenience method)
    // 4: actual caller
    const callerLine = stack[4] || '';

    let match = callerLine.match(/\((.+):(\d+):\d+\)/);
    if (!match) {
      match = callerLine.match(/at\s+(.+):(\d+):\d+/);
    }
    if (!match) {
      match = callerLine.match(/@(.+):(\d+):\d+/);
    }

    if (match) {
      let filename = match[1].split('/').pop() || match[1];
      // Strip query strings (e.g., ?t=1234567890 from Vite)
      filename = filename.split('?')[0];
      const lineNumber = match[2];
      return `${filename}:${lineNumber}`;
    }
  } catch {
    // Ignore errors in call site extraction
  }
  return '';
}

/**
 * Core logging function
 */
function log(message: string, level: LogLevel, ...args: unknown[]): void {
  if (!isLogging || level < outputLevel) return;

  const levelName =
    Object.keys(LEVELS).find(
      (k) => LEVELS[k as keyof typeof LEVELS] === level
    ) || 'LOG';
  const callSite =
    showCallSites && level >= callSiteLevel ? getCallSite() : '';

  // Select appropriate console method
  let consoleFn: typeof console.log;
  switch (level) {
    case LEVELS.ERROR:
      consoleFn = console.error;
      break;
    case LEVELS.WARN:
      consoleFn = console.warn;
      break;
    case LEVELS.DEBUG:
      consoleFn = console.debug;
      break;
    default:
      consoleFn = console.info;
  }

  // Format output: [LEVEL] message ...args [file:line]
  if (args.length > 0) {
    if (callSite) {
      consoleFn(`[${levelName}]`, message, ...args, `[${callSite}]`);
    } else {
      consoleFn(`[${levelName}]`, message, ...args);
    }
  } else {
    if (callSite) {
      consoleFn(`[${levelName}]`, message, `[${callSite}]`);
    } else {
      consoleFn(`[${levelName}]`, message);
    }
  }
}

export const logger = {
  /** Log a debug message (level 0) */
  debug: (message: string, ...args: unknown[]) =>
    log(message, LEVELS.DEBUG, ...args),

  /** Log an info message (level 1) */
  info: (message: string, ...args: unknown[]) =>
    log(message, LEVELS.INFO, ...args),

  /** Log a warning message (level 2) */
  warn: (message: string, ...args: unknown[]) =>
    log(message, LEVELS.WARN, ...args),

  /** Log an error message (level 3) */
  error: (message: string, ...args: unknown[]) =>
    log(message, LEVELS.ERROR, ...args),

  /** Enable or disable logging */
  enable: (on: boolean) => {
    isLogging = on;
  },

  /** Set the minimum output level */
  setOutputLevel: (level: LogLevel) => {
    if (typeof level === 'number' && level >= 0 && level <= 3) {
      outputLevel = level;
    }
  },

  /** Enable or disable call site tracking */
  enableCallSites: (on: boolean) => {
    showCallSites = on;
  },

  /** Set the minimum level for call site display */
  setCallSiteLevel: (level: LogLevel) => {
    if (typeof level === 'number' && level >= 0 && level <= 3) {
      callSiteLevel = level;
    }
  },

  /** Check if logging is enabled */
  isEnabled: () => isLogging,

  /** Get the current output level */
  getOutputLevel: () => outputLevel,

  /** Log level constants */
  LEVELS,
};
