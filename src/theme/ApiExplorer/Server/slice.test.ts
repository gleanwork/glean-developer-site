import { describe, expect, it } from 'vitest';
import reducer, { setCustomServer, setServer, type State } from './slice';

const legacyServer = {
  url: 'https://{instance}-be.glean.com',
  variables: { instance: { default: 'instance-name' } },
};

describe('personalized API Explorer server reducer', () => {
  it('preserves original option-selection behavior', () => {
    const state: State = { options: [legacyServer] };
    const next = reducer(state, setServer(JSON.stringify(legacyServer)));
    expect(next.value).toEqual(legacyServer);
  });

  it('accepts a normalized custom server only through the dedicated action', () => {
    const state: State = { options: [legacyServer], value: legacyServer };
    const customServer = {
      url: '{serverUrl}',
      variables: {
        serverUrl: { default: 'https://custom.example.com' },
      },
    };
    const next = reducer(state, setCustomServer(JSON.stringify(customServer)));
    expect(next.value).toEqual(customServer);
    expect(next.options).toEqual([legacyServer]);
  });
});
