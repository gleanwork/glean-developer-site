import { describe, it, expect } from 'vitest';
import { isOAuthEligiblePath, scopeForPath } from './oauth';

describe('API Explorer OAuth helpers', () => {
  it('offers OAuth on Client and Platform API pages, not Indexing', () => {
    expect(isOAuthEligiblePath('/api/client-api/search/search')).toBe(true);
    expect(
      isOAuthEligiblePath('/api/platform-api/platform-agents-create-run'),
    ).toBe(true);
    expect(isOAuthEligiblePath('/api/indexing-api/index-document')).toBe(false);
    expect(isOAuthEligiblePath('/libraries/web-sdk/overview')).toBe(false);
  });

  it('maps docs paths to their API scope', () => {
    expect(scopeForPath('/api/client-api/search/search')).toBe('search');
    expect(scopeForPath('/api/client-api/chat/chat')).toBe('chat');
    expect(scopeForPath('/api/client-api/agents/run-agent')).toBe('agents');
    expect(scopeForPath('/api/client-api/governance/x')).toBe(
      'data_governance',
    );
    expect(scopeForPath('/api/client-api/authentication/createauthtoken')).toBe(
      'auth_token_creator',
    );
    expect(scopeForPath('/api/platform-api/platform-agents-create-run')).toBe(
      'agents',
    );
    expect(scopeForPath('/api/platform-api/platform-search')).toBe('search');
  });

  it('returns undefined for unmapped groups so no scope is requested', () => {
    expect(scopeForPath('/api/client-api/messages/list')).toBeUndefined();
    expect(
      scopeForPath('/api/platform-api/platform-skills-list'),
    ).toBeUndefined();
    expect(scopeForPath('/api/indexing-api/index-document')).toBeUndefined();
  });
});
