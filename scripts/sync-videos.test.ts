import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  copyLocalMedia,
  listedRegistry,
  parseVideoRegistry,
  resolveVideos,
  type VideoRegistry,
} from './sync-videos';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

function registry(overrides: Partial<VideoRegistry> = {}): VideoRegistry {
  return {
    mediaBaseUrl: null,
    tracks: [{ id: 'mcp', label: 'MCP', description: 'MCP videos.' }],
    videos: [
      {
        id: 'mcp-overview',
        title: 'The Glean MCP server',
        summary: 'What it is.',
        track: 'mcp',
        type: 'explainer',
        visibility: 'public',
        related: { doc: '/guides/mcp', docLabel: 'MCP' },
        durationSeconds: 65,
        updated: '2026-10-05',
        media: {
          file: `mcp-overview.${sha('mp4').slice(0, 10)}.mp4`,
          poster: `mcp-overview.${sha('webp').slice(0, 10)}.webp`,
          sha256: sha('mp4'),
          posterSha256: sha('webp'),
          bytes: 3,
          width: 1920,
          height: 1080,
        },
        transcript: ['Hello.'],
      },
    ],
    ...overrides,
  };
}

describe('parseVideoRegistry', () => {
  it('accepts a registry with content-hashed, sha-pinned media', () => {
    expect(parseVideoRegistry(JSON.stringify(registry())).videos).toHaveLength(
      1,
    );
  });

  it('rejects media that is not pinned by hash', () => {
    const bad = registry();
    bad.videos[0].media.file = 'mcp-overview.mp4';
    expect(() => parseVideoRegistry(JSON.stringify(bad))).toThrow(
      /content-hashed/,
    );
  });
});

describe('listedRegistry', () => {
  it('drops videos that are not hosted, their empty tracks, and the hosted field', () => {
    const base = registry();
    const held = {
      ...base.videos[0],
      id: 'ema',
      track: 'identity',
      hosted: false,
    };
    const r = registry({
      tracks: [
        ...base.tracks,
        { id: 'identity', label: 'Identity', description: 'Auth.' },
      ],
      videos: [{ ...base.videos[0], hosted: true }, held],
    });
    const listed = listedRegistry(r);
    expect(listed.videos.map((v) => v.id)).toEqual(['mcp-overview']);
    expect(listed.tracks).toEqual(base.tracks);
    expect('hosted' in listed.videos[0]).toBe(false);
    expect(JSON.stringify(listed)).not.toContain('ema');
    // resolves under the strict site schema
    expect(resolveVideos(listed, 'local').videos).toHaveLength(1);
  });

  it('keeps registries without the hosted field as they are', () => {
    expect(listedRegistry(registry()).videos).toHaveLength(1);
  });
});

describe('resolveVideos', () => {
  it('points at the hosted files when mediaBaseUrl is set', () => {
    const data = resolveVideos(
      registry({ mediaBaseUrl: 'https://media.example.com/videos/' }),
      'hosted',
    );
    expect(data.videos[0].media).toEqual({
      src: `https://media.example.com/videos/${registry().videos[0].media.file}`,
      poster: `https://media.example.com/videos/${registry().videos[0].media.poster}`,
      width: 1920,
      height: 1080,
    });
  });

  it('points at the static copies for a local preview', () => {
    const media = resolveVideos(registry(), 'local').videos[0].media;
    expect(media.src).toMatch(/^\/videos\/mcp-overview\.[0-9a-f]{10}\.mp4$/);
    expect(media.poster).toMatch(
      /^\/img\/videos\/mcp-overview\.[0-9a-f]{10}\.webp$/,
    );
  });

  it('refuses a hosted sync while the media has no host', () => {
    expect(() => resolveVideos(registry(), 'hosted')).toThrow(/mediaBaseUrl/);
  });

  it('keeps every metadata field, and fails on ones the site does not know', () => {
    const data = resolveVideos(registry(), 'local');
    expect(data.videos[0].title).toBe('The Glean MCP server');
    const extra = registry();
    extra.videos[0].surprise = true;
    expect(() => resolveVideos(extra, 'local')).toThrow();
  });
});

describe('copyLocalMedia', () => {
  function setup(content = { mp4: 'mp4', webp: 'webp' }) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'videos-'));
    const media = path.join(dir, 'media');
    fs.mkdirSync(media);
    const reg = registry();
    fs.writeFileSync(path.join(media, reg.videos[0].media.file), content.mp4);
    fs.writeFileSync(
      path.join(media, reg.videos[0].media.poster),
      content.webp,
    );
    return {
      reg,
      media,
      out: path.join(dir, 'v'),
      posters: path.join(dir, 'p'),
    };
  }

  it('copies the approved files, and is a no-op the second time', () => {
    const { reg, media, out, posters } = setup();
    expect(copyLocalMedia(reg, media, out, posters).copied).toBe(2);
    expect(copyLocalMedia(reg, media, out, posters).copied).toBe(0);
  });

  it('refuses a file whose bytes do not match the registry', () => {
    const { reg, media, out, posters } = setup({
      mp4: 'tampered',
      webp: 'webp',
    });
    expect(() => copyLocalMedia(reg, media, out, posters)).toThrow(/sha256/);
  });

  it('reports files it does not know about, and leaves them alone', () => {
    const { reg, media, out, posters } = setup();
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'old.mp4'), 'old');
    const { stale } = copyLocalMedia(reg, media, out, posters);
    expect(stale.some((f) => f.endsWith('old.mp4'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'old.mp4'))).toBe(true);
  });
});
