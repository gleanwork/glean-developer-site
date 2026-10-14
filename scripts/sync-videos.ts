/**
 * Syncs developer videos out of gleanwork/glean-developer-videos (private).
 *
 * That repo owns what each video is (metadata, transcript, and the approved
 * MP4 and poster, pinned by SHA-256 in its registry.json). This site owns
 * presentation. Mirrors scripts/sync-registry.mjs for the cookbook: fetched on
 * demand, never live during a build, and the results are committed:
 *
 * - registry.json -> data/videos-registry.json (verbatim snapshot, plus where
 *   it came from in `_source`)
 * - src/data/videos.json, the records the Videos components read, with
 *   `media.src` / `media.poster` resolved to URLs
 *
 * Media is never committed here. The registry's `mediaBaseUrl` says where the
 * approved files are hosted. Until it's set, sync from a local checkout
 * instead, which copies the approved files from its dist/media into the
 * git-ignored static/videos/ and static/img/videos/ (checking each SHA-256).
 * Local syncs are for previewing only: CI rejects a committed local snapshot.
 *
 * Usage:
 *   pnpm videos:sync                                      # from GitHub
 *   GLEAN_DEVELOPER_VIDEOS_DIR=~/workspace/glean/glean-developer-videos pnpm videos:sync
 *   GLEAN_DEVELOPER_VIDEOS_REF=<branch> pnpm videos:sync  # preview a branch
 *
 * Auth (GitHub): GITHUB_TOKEN in CI, otherwise your own `gh` login.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import prettier from 'prettier';
import { videosFileSchema, type VideosFile } from '../src/types/video';

export const REPO = 'gleanwork/glean-developer-videos';
const repoRoot = path.resolve(import.meta.dirname, '..');
const snapshotFile = path.join(repoRoot, 'data', 'videos-registry.json');
const outputFile = path.join(repoRoot, 'src', 'data', 'videos.json');
const localVideoDir = path.join(repoRoot, 'static', 'videos');
const localPosterDir = path.join(repoRoot, 'static', 'img', 'videos');

/** Where local copies are served from (see static/). */
export const LOCAL_VIDEO_BASE = '/videos';
export const LOCAL_POSTER_BASE = '/img/videos';

export interface RegistryMedia {
  file: string;
  poster: string;
  sha256: string;
  posterSha256: string;
  bytes: number;
  width: number;
  height: number;
}

export interface RegistryVideo {
  id: string;
  /** False while a captures/legal sign-off is open: its media isn't hosted, so the site skips it. */
  hosted?: boolean;
  media: RegistryMedia;
  [key: string]: unknown;
}

export interface VideoRegistry {
  mediaBaseUrl: string | null;
  tracks: unknown[];
  videos: RegistryVideo[];
  [key: string]: unknown;
}

export type SyncSource =
  | { kind: 'local'; dir: string; commit: string; dirty: boolean }
  | { kind: 'github'; repo: string; ref: string };

const HASHED = /^[a-z0-9]+(-[a-z0-9]+)*\.[0-9a-f]{10}\.(mp4|webp)$/;

export function parseVideoRegistry(raw: string): VideoRegistry {
  const data = JSON.parse(raw) as VideoRegistry;
  if (!Array.isArray(data?.videos) || !Array.isArray(data?.tracks)) {
    throw new Error('registry.json: expected { tracks: [], videos: [] }.');
  }
  if (data.mediaBaseUrl !== null && typeof data.mediaBaseUrl !== 'string') {
    throw new Error('registry.json: mediaBaseUrl must be a string or null.');
  }
  for (const v of data.videos) {
    const m = v?.media;
    if (
      !m ||
      !HASHED.test(m.file) ||
      !HASHED.test(m.poster) ||
      !/^[0-9a-f]{64}$/.test(m.sha256) ||
      !/^[0-9a-f]{64}$/.test(m.posterSha256)
    ) {
      throw new Error(
        `registry.json: ${v?.id ?? '?'} needs media { file, poster, sha256, posterSha256 } with content-hashed names.`,
      );
    }
  }
  return data;
}

/**
 * What the site lists: videos that aren't marked `hosted: false`, and the
 * tracks that still have videos. Applied before anything is written, so an
 * unlisted video's metadata never lands in this (public) repo.
 */
export function listedRegistry(registry: VideoRegistry): VideoRegistry {
  const videos = registry.videos
    .filter((v) => v.hosted !== false)
    .map(({ hosted: _hosted, ...v }) => v as RegistryVideo);
  const used = new Set(videos.map((v) => v.track));
  const tracks = registry.tracks.filter((t) =>
    used.has((t as { id?: unknown })?.id),
  );
  return { ...registry, tracks, videos };
}

/**
 * The records the site reads: registry metadata as-is, with media resolved to
 * URLs. Hosted media (mediaBaseUrl) wins; otherwise the local static copies.
 */
export function resolveVideos(
  registry: VideoRegistry,
  mode: 'hosted' | 'local',
): VideosFile {
  const base = registry.mediaBaseUrl?.replace(/\/+$/, '');
  if (mode === 'hosted' && !base) {
    throw new Error(
      `${REPO}'s registry has no mediaBaseUrl yet, so its media isn't hosted. ` +
        'Preview from a local checkout instead: GLEAN_DEVELOPER_VIDEOS_DIR=<path> pnpm videos:sync',
    );
  }
  const url = (file: string, localBase: string) =>
    mode === 'hosted' ? `${base}/${file}` : `${localBase}/${file}`;
  const videos = registry.videos.map((v) => ({
    ...v,
    media: {
      src: url(v.media.file, LOCAL_VIDEO_BASE),
      poster: url(v.media.poster, LOCAL_POSTER_BASE),
      width: v.media.width,
      height: v.media.height,
    },
  }));
  return videosFileSchema.parse({ tracks: registry.tracks, videos });
}

function sha256(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** Copy the approved files out of a local checkout's dist/media, verified. */
export function copyLocalMedia(
  registry: VideoRegistry,
  mediaDir: string,
  videoDir = localVideoDir,
  posterDir = localPosterDir,
): { copied: number; stale: string[] } {
  fs.mkdirSync(videoDir, { recursive: true });
  fs.mkdirSync(posterDir, { recursive: true });
  let copied = 0;
  const wanted = new Set<string>();
  for (const v of registry.videos) {
    for (const [name, sha, dir] of [
      [v.media.file, v.media.sha256, videoDir],
      [v.media.poster, v.media.posterSha256, posterDir],
    ] as const) {
      wanted.add(name);
      const src = path.join(mediaDir, name);
      if (!fs.existsSync(src)) {
        throw new Error(
          `${v.id}: ${name} isn't in ${mediaDir}. The approved file must be there; ` +
            'see "gv registry" in that repo.',
        );
      }
      if (sha256(src) !== sha) {
        throw new Error(`${v.id}: ${src} doesn't match the registry's sha256.`);
      }
      const dst = path.join(dir, name);
      if (fs.existsSync(dst) && sha256(dst) === sha) continue;
      fs.copyFileSync(src, dst);
      copied += 1;
    }
  }
  // Only ever report leftovers; local copies are cheap to keep and easy to clean by hand.
  const stale = [videoDir, posterDir].flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((f) => /\.(mp4|webp)$/.test(f) && !wanted.has(f))
      .map((f) => path.relative(repoRoot, path.join(dir, f))),
  );
  return { copied, stale };
}

function git(dir: string, args: string[]): string {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
}

async function fetchRegistryFromGitHub(ref: string): Promise<string> {
  const api = `repos/${REPO}/contents/registry.json${ref ? `?ref=${ref}` : ''}`;
  if (process.env.GITHUB_TOKEN) {
    const response = await fetch(`https://api.github.com/${api}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      throw new Error(
        `GitHub API request failed for registry.json: HTTP ${response.status} ${response.statusText}`,
      );
    }
    return response.text();
  }
  const base64 = execFileSync('gh', ['api', api, '--jq', '.content'], {
    encoding: 'utf8',
  });
  return Buffer.from(base64.replace(/\s/g, ''), 'base64').toString('utf8');
}

async function writeJson(file: string, data: unknown): Promise<void> {
  const text = await prettier.format(JSON.stringify(data), {
    ...(await prettier.resolveConfig(file)),
    filepath: file,
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

async function main(): Promise<void> {
  const localDir = process.env.GLEAN_DEVELOPER_VIDEOS_DIR?.replace(
    /^~(?=$|\/)/,
    os.homedir(),
  );
  let raw: string;
  let source: SyncSource;
  if (localDir) {
    const dir = path.resolve(localDir);
    raw = fs.readFileSync(path.join(dir, 'registry.json'), 'utf8');
    source = {
      kind: 'local',
      dir,
      commit: git(dir, ['rev-parse', 'HEAD']),
      dirty: git(dir, ['status', '--porcelain', '--', 'registry.json']) !== '',
    };
  } else {
    const ref = process.env.GLEAN_DEVELOPER_VIDEOS_REF ?? '';
    console.log(
      `📡 Fetching registry.json from ${REPO}${ref ? `@${ref}` : ''}...`,
    );
    raw = await fetchRegistryFromGitHub(ref);
    source = { kind: 'github', repo: REPO, ref: ref || 'default branch' };
  }

  const full = parseVideoRegistry(raw);
  const registry = listedRegistry(full);
  const skipped = full.videos
    .filter((v) => v.hosted === false)
    .map((v) => v.id);
  if (skipped.length) {
    console.log(
      `⏸️  Not listing ${skipped.join(', ')}: sign-offs still open, so not hosted.`,
    );
  }
  const hosted = Boolean(registry.mediaBaseUrl);
  if (!hosted && source.kind !== 'local') {
    resolveVideos(registry, 'hosted'); // throws the explanation
  }
  const data = resolveVideos(registry, hosted ? 'hosted' : 'local');

  if (!hosted && source.kind === 'local') {
    const { copied, stale } = copyLocalMedia(
      registry,
      path.join(source.dir, 'dist', 'media'),
    );
    console.log(
      `🎞️  Copied ${copied} file(s) into static/ (verified against the registry's sha256).`,
    );
    if (stale.length) {
      console.log(
        `   ${stale.length} file(s) in static/ aren't in the registry (left in place): ${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ', ...' : ''}`,
      );
    }
  }

  await writeJson(snapshotFile, { _source: source, ...registry });
  await writeJson(outputFile, data);
  const where =
    source.kind === 'local'
      ? `${source.dir} @ ${source.commit.slice(0, 7)}${source.dirty ? ' (registry.json has uncommitted changes)' : ''}`
      : `${source.repo} (${source.ref})`;
  console.log(
    `✅ Synced ${data.videos.length} videos from ${where} into ${path.relative(repoRoot, outputFile)}`,
  );
  if (!hosted) {
    console.log(
      "⚠️  Media isn't hosted yet (no mediaBaseUrl): this sync is for local preview. Don't commit it.",
    );
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: Error) => {
    console.error('❌', error.message);
    process.exit(1);
  });
}
