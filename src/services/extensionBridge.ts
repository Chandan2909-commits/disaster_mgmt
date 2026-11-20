import { localAgentService } from './localAgentService';

export interface ExtensionStatus {
  isInstalled: boolean;
  hasLocalAgent: boolean;
  version?: string;
  source: 'chrome-extension' | 'local-agent' | 'none';
}

export const extensionBridge = {
  async detectExtension(): Promise<ExtensionStatus> {
    // 1. Check DOM dataset injected by Chrome Extension (CSP Safe)
    if (typeof document !== 'undefined') {
      const domFlag = document.documentElement?.getAttribute('data-disaster-mgmt-extension');
      const domVer = document.documentElement?.getAttribute('data-extension-version');
      const extObj = typeof window !== 'undefined' ? (window as any).__DISASTER_MGMT_EXTENSION__ : null;

      if (domFlag === 'active' || extObj?.active) {
        return {
          isInstalled: true,
          hasLocalAgent: true,
          version: domVer || extObj?.version || '1.2.0',
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
