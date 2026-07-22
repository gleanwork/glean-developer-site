import { describe, it, expect } from 'vitest';
import { isOAuthEligiblePath, scopeForPath } from './oauth';

describe('API Explorer OAuth helpers', () => {
  it('offers OAuth only on Client API pages', () => {
    expect(isOAuthEligiblePath('/api/client-api/search/search')).toBe(true);
    expect(isOAuthEligiblePath('/api/indexing-api/index-document')).toBe(false);
    expect(isOAuthEligiblePath('/api/platform-api/run-agent')).toBe(false);
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
  });

  it('returns undefined for unmapped groups so no scope is requested', () => {
    expect(scopeForPath('/api/client-api/messages/list')).toBeUndefined();
    expect(scopeForPath('/api/indexing-api/index-document')).toBeUndefined();
  });
});
