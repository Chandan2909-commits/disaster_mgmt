import { localAgentService } from './localAgentService';

export interface ExtensionStatus {
  isInstalled: boolean;
  hasLocalAgent: boolean;
  version?: string;
  source: 'chrome-extension' | 'local-agent' | 'none';
}

export const extensionBridge = {
  async detectExtension(): Promise<ExtensionStatus> {
    // 1. Check window object or DOM dataset injected by Chrome Extension
    if (typeof window !== 'undefined') {
      const ext = (window as any).__DISASTER_MGMT_EXTENSION__;
      const domFlag = document.documentElement?.getAttribute('data-disaster-mgmt-extension');

      if (ext?.active || domFlag === 'active') {
        return {
          isInstalled: true,
          hasLocalAgent: true,
          version: ext?.version || '1.0.0',
          source: 'chrome-extension',
        };
      }
    }

    // 2. Check if local Python agent is listening on 127.0.0.1:8765
    const agentHealth = await localAgentService.checkHealth();
    if (agentHealth && agentHealth.status === 'online') {
      return {
        isInstalled: true,
        hasLocalAgent: true,
        version: agentHealth.version,
        source: 'local-agent',
      };
    }

    return {
      isInstalled: false,
      hasLocalAgent: false,
      source: 'none',
    };
  },
};
