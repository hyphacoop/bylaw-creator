import { logEvent, LogLevel } from '../utils/logger';

export interface JobSubmissionResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  updatedAt?: number;
  completedAt?: number;
  failedAt?: number;
  result?: string;
  error?: string;
  processingTimeMs?: number;
  suggestedPollInterval?: number;
}

export interface JobSubmissionData {
  formData: any;
  payload: any;
  isOllamaModel: boolean;
}

export class JobService {
  private baseUrl: string;
  private statusCache: Map<string, { status: JobStatusResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 500; // Cache for 500ms to avoid duplicate calls

  constructor() {
    // In local development, use the proxy server
    // In production, use the configured API URL or current origin
    if (window.location.hostname === 'localhost') {
      this.baseUrl = 'http://localhost:4000'; // Use proxy server
    } else {
      this.baseUrl = process.env.REACT_APP_API_URL || '';
    }
  }

  async submitJob(jobData: JobSubmissionData): Promise<JobSubmissionResponse> {
    logEvent('Submitting job for bylaw generation', LogLevel.INFO, { 
      coopName: jobData.formData.coopName,
      model: jobData.payload.model,
      isOllama: jobData.isOllamaModel
    });
    
    try {
      const response = await fetch(`${this.baseUrl}/api/jobs/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit job');
      }

      const result = await response.json();
      logEvent('Job submitted successfully', LogLevel.INFO, { jobId: result.jobId });
      
      return result;
    } catch (error: any) {
      logEvent('Job submission failed', LogLevel.ERROR, { error: error.message });
      throw error;
    }
  }

  async checkStatus(jobId: string): Promise<JobStatusResponse> {
    // Check cache first
    const cached = this.statusCache.get(jobId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.status;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/jobs/status?jobId=${jobId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check job status');
      }

      const status = await response.json();
      
      // Cache the result
      this.statusCache.set(jobId, { status, timestamp: Date.now() });
      
      // Clean up cache if job is complete
      if (status.status === 'completed' || status.status === 'failed') {
        setTimeout(() => this.statusCache.delete(jobId), 30000); // Keep for 30s then remove
      }

      return status;
    } catch (error: any) {
      logEvent('Job status check failed', LogLevel.ERROR, { error: error.message, jobId });
      throw error;
    }
  }

  async pollUntilComplete(
    jobId: string, 
    onProgress?: (status: JobStatusResponse) => void,
    initialPollInterval: number = 5000, // Start with 5 second
    maxAttempts: number = 100 // Reduce max attempts since we'll use longer intervals
  ): Promise<JobStatusResponse> {
    return this._pollRecursive(jobId, onProgress, initialPollInterval, 0, maxAttempts);
  }

  private async _pollRecursive(
    jobId: string,
    onProgress?: (status: JobStatusResponse) => void,
    pollInterval: number = 5000,
    attempts: number = 0,
    maxAttempts: number = 100
  ): Promise<JobStatusResponse> {
    if (attempts >= maxAttempts) {
      throw new Error('Job polling timeout - maximum attempts reached');
    }

    try {
      const status = await this.checkStatus(jobId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        logEvent('Job completed successfully', LogLevel.INFO, { jobId });
        return status;
      }
      
      if (status.status === 'failed') {
        logEvent('Job failed', LogLevel.ERROR, { jobId, error: status.error });
        throw new Error(status.error || 'Job failed');
      }

      // Calculate next poll interval
      let nextPollInterval: number;
      if (status.suggestedPollInterval) {
        nextPollInterval = status.suggestedPollInterval;
        logEvent('Using server-suggested poll interval', LogLevel.INFO, { 
          jobId, 
          suggestedInterval: `${nextPollInterval/1000}s`,
          processingTime: status.processingTimeMs ? `${status.processingTimeMs/1000}s` : 'unknown'
        });
      } else {
        // Exponential backoff: increase polling interval gradually
        // 5s → 6.25s → 7.8125s → 9.765625s → 12.20703125s → 15.2587890625s → 19.073486328125s (max)
        nextPollInterval = Math.min(pollInterval * 1.25, 25000);
      }
      
      logEvent(`Polling job status (attempt ${attempts + 1})`, LogLevel.INFO, { 
        jobId, 
        status: status.status, 
        nextPollIn: `${nextPollInterval/1000}s`,
        totalAttempts: attempts + 1
      });

      // Job still in progress, wait and retry
      await new Promise(resolve => setTimeout(resolve, nextPollInterval));
      return this._pollRecursive(jobId, onProgress, nextPollInterval, attempts + 1, maxAttempts);
      
    } catch (error: any) {
      logEvent('Error polling job status', LogLevel.ERROR, { error: error.message, jobId, attempts });
      throw error;
    }
  }
}

export const jobService = new JobService(); 