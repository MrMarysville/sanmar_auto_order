import debug from 'debug';
import util from 'util';

export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

// Create debug instances for different log levels
const debugError = debug('app:error');
const debugWarn = debug('app:warn');
const debugInfo = debug('app:info');
const debugDebug = debug('app:debug');
const debugTrace = debug('app:trace');

/**
 * Formats the log message with timestamp and service name
 * @param {string} level - Log level
 * @param {string} service - Service name
 * @param {string|Object|Error} message - Message to log
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, service, message) {
  const timestamp = new Date().toISOString();
  let formattedMessage = message;

  if (message instanceof Error) {
    formattedMessage = message.stack || message.message;
  } else if (typeof message === 'object') {
    formattedMessage = util.inspect(message, { depth: null, colors: true });
  }

  return `[${timestamp}] [${level}] [${service}] ${formattedMessage}`;
}

/**
 * Centralized logging function
 * @param {string} level - Log level from LOG_LEVELS
 * @param {string} service - Name of the service logging the message
 * @param {string|Object|Error} message - Message or object to log
 */
export function log(level, service, message) {
  const formattedMessage = formatLogMessage(level, service, message);

  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(formattedMessage);
      debugError(formattedMessage);
      break;
    case LOG_LEVELS.WARN:
      console.warn(formattedMessage);
      debugWarn(formattedMessage);
      break;
    case LOG_LEVELS.INFO:
      console.info(formattedMessage);
      debugInfo(formattedMessage);
      break;
    case LOG_LEVELS.DEBUG:
      debugDebug(formattedMessage);
      break;
    case LOG_LEVELS.TRACE:
      debugTrace(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
      debugInfo(formattedMessage);
  }
}
