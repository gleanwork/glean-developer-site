import { MCPConfigRegistry } from '@gleanwork/mcp-config-schema/browser';

describe('mcp-config-schema theme dependency', () => {
  it('exposes getManagedSetupUrl on the installed package', () => {
    const chatgpt = 'https://chatgpt.com/admin/apps?tab=available&q=glean';
    const registry = new MCPConfigRegistry({
      managedSetupUrls: { chatgpt },
    });

    expect(registry.getManagedSetupUrl('chatgpt')).toBe(chatgpt);
    expect(registry.getManagedSetupUrl('linear')).toBeUndefined();
  });
});
