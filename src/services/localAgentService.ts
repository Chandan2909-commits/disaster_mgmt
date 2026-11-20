export interface AgentHealthResponse {
  status: string;
  agent: string;
  version: string;
  mode: string;
  selenium_available: boolean;
  browser_active?: boolean;
}

export interface PrepareMessagePayload {
  level: number;
  status: string;
  score: number;
  trend: string;
  chat_target?: string;
  send_action?: boolean;
  message?: string;
}

export interface PrepareMessageResponse {
  success: boolean;
  workflow_stage: string;
  message: string;
  chat_target?: string;
  prepared_text: string;
  send_blocked?: boolean;
  is_sent?: boolean;
  error?: string;
}

export interface MessageStatusResponse {
  active: boolean;
  browser_connected: boolean;
  is_sent: boolean;
  delivery_status: 'DELIVERED' | 'SENT' | 'SENT_SINGLE_TICK' | 'PENDING_CLOCK' | 'WAITING_FOR_QR' | 'DRAFT_IN_COMPOSE' | 'NO_OUTGOING_MESSAGE' | 'DISCONNECTED' | 'CHECK_ERROR';
  status_label: string;
  last_target?: string;
  sent_at?: string;
  last_message_preview?: string;
}

const LOCAL_AGENT_URL = 'http://127.0.0.1:8765';

export const localAgentService = {
  async checkHealth(): Promise<AgentHealthResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${LOCAL_AGENT_URL}/health`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return (await res.json()) as AgentHealthResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  async prepareTestMessage(payload: PrepareMessagePayload): Promise<PrepareMessageResponse> {
    try {
      const res = await fetch(`${LOCAL_AGENT_URL}/simulation/prepare-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return (await res.json()) as PrepareMessageResponse;
      }
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        workflow_stage: 'LOCAL_AGENT_FAILED',
        message: err.error || 'Failed to prepare/send message via local companion agent',
        prepared_text: '',
      };
    } catch (err: any) {
      return {
        success: false,
        workflow_stage: 'LOCAL_AGENT_FAILED',
        message: err.message || 'Cannot connect to 127.0.0.1:8765',
        prepared_text: '',
      };
    }
  },

  async checkDeliveryStatus(): Promise<MessageStatusResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${LOCAL_AGENT_URL}/simulation/message-status`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return (await res.json()) as MessageStatusResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  async stopSession(): Promise<boolean> {
    try {
      const res = await fetch(`${LOCAL_AGENT_URL}/simulation/stop`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },
};
