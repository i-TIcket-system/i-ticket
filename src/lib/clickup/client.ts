/**
 * ClickUp Integration Client
 *
 * One-way integration: i-Ticket -> ClickUp
 * Creates tasks for support tickets, audit logs, and low slot alerts
 *
 * Based on existing patterns from:
 * - src/lib/sms/gateway.ts (singleton, demo mode, retry logic)
 */

interface ClickUpConfig {
  apiKey: string;
  listSupport: string;
  listAlerts: string;
  listAudit: string;
  enabled: boolean;
}

export interface CreateTaskParams {
  listId: string;
  name: string;
  description: string;
  priority?: 1 | 2 | 3 | 4; // 1=Urgent, 2=High, 3=Normal, 4=Low
  tags?: string[];
  dueDate?: Date;
}

interface ClickUpTaskResponse {
  id: string;
  name: string;
  url: string;
  status: { status: string };
}

/**
 * ClickUp API Client
 *
 * Handles task creation in ClickUp for various i-Ticket events.
 * Uses non-blocking async calls to avoid slowing down API responses.
 */
export class ClickUpClient {
  private config: ClickUpConfig;
  private baseUrl = 'https://api.clickup.com/api/v2';

  constructor() {
    this.config = {
      apiKey: process.env.CLICKUP_API_KEY || '',
      listSupport: process.env.CLICKUP_LIST_SUPPORT || '',
      listAlerts: process.env.CLICKUP_LIST_ALERTS || '',
      listAudit: process.env.CLICKUP_LIST_AUDIT || '',
      enabled: process.env.CLICKUP_ENABLED === 'true',
    };

    if (this.config.enabled && !this.config.apiKey) {
      console.warn('[ClickUp] API key not configured. Integration disabled.');
    }
  }

  /**
   * Check if ClickUp integration is properly configured and enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * Create a task in ClickUp
   * Non-blocking - errors are logged but do not affect caller
   */
  async createTask(params: CreateTaskParams): Promise<ClickUpTaskResponse | null> {
    if (!this.isEnabled()) {
      console.log(`[ClickUp DEMO] Would create task: ${params.name}`);
      return null;
    }

    try {
      const body: Record<string, unknown> = {
        name: params.name,
        description: params.description,
        priority: params.priority || 3,
      };

      if (params.tags && params.tags.length > 0) {
        body.tags = params.tags;
      }

      if (params.dueDate) {
        body.due_date = params.dueDate.getTime();
      }

      const response = await fetch(
        `${this.baseUrl}/list/${params.listId}/task`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.config.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ClickUp API error (${response.status}): ${errorText}`);
      }

      const data: ClickUpTaskResponse = await response.json();
      console.log(`[ClickUp] Task created: ${data.id} - ${params.name}`);
      return data;
    } catch (error) {
      console.error('[ClickUp] Create task error:', error);
      return null;
    }
  }

  /**
   * Create task with retry logic
   * Non-blocking - fires and forgets with retries
   */
  async createTaskWithRetry(
    params: CreateTaskParams,
    maxRetries = 3
  ): Promise<ClickUpTaskResponse | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.createTask(params);
        if (result) return result;

        // If null (demo mode or disabled), don't retry
        if (!this.isEnabled()) return null;
      } catch (error) {
        console.error(`[ClickUp] Attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[ClickUp] Failed to create task after ${maxRetries} attempts`);
    return null;
  }

  /**
   * Fire-and-forget task creation
   * Does not block the caller - perfect for API routes
   */
  createTaskAsync(params: CreateTaskParams): void {
    // Use setImmediate to defer execution and not block the caller
    setImmediate(() => {
      this.createTaskWithRetry(params).catch(err => {
        console.error('[ClickUp] Async task creation failed:', err);
      });
    });
  }

  // Getter for list IDs
  get lists() {
    return {
      support: this.config.listSupport,
      alerts: this.config.listAlerts,
      audit: this.config.listAudit,
    };
  }
}

// Singleton instance
let clickUpInstance: ClickUpClient | null = null;

/**
 * Get singleton ClickUp client instance
 */
export function getClickUpClient(): ClickUpClient {
  if (!clickUpInstance) {
    clickUpInstance = new ClickUpClient();
  }
  return clickUpInstance;
}
