// src/utils/logger.ts
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export const logEvent = (eventName: string, level: LogLevel = LogLevel.INFO, data: any = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${eventName}`, data);
  
  // Store in localStorage for development tracking
  try {
    const logs = JSON.parse(localStorage.getItem('bylawGeneratorLogs') || '[]');
    logs.push({
      timestamp,
      level,
      event: eventName,
      data
    });
    localStorage.setItem('bylawGeneratorLogs', JSON.stringify(logs.slice(-100))); // Keep last 100 logs
  } catch (error) {
    console.error('Error logging to localStorage:', error);
  }
};

export const logError = (component: string, message: string, error?: any) => {
  logEvent(`ERROR in ${component}: ${message}`, LogLevel.ERROR, { 
    errorMessage: error?.message,
    stack: error?.stack
  });
}; 