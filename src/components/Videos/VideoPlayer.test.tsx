import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());
vi.mock('../../lib/analytics', () => ({ trackEvent: trackSpy }));
vi.mock('@docusaurus/router', () => ({
  useLocation: () => ({ pathname: '/guides/mcp/cursor', search: '' }),
}));

import { VideoDialog } from './VideoPlayer';
import { ALL_VIDEOS } from './videoData';

const [first, second] = ALL_VIDEOS;

function playback(video: HTMLVideoElement, currentTime: number): void {
  Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
  Object.defineProperty(video, 'currentTime', {
    configurable: true,
    value: currentTime,
  });
  fireEvent.timeUpdate(video);
}

function milestones(): Array<[string, string]> {
  return trackSpy.mock.calls.map(([, props]) => [props.video, props.milestone]);
}

describe('VideoDialog analytics', () => {
  beforeEach(() => {
    trackSpy.mockClear();
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  it('reports start, half, and complete once each per opened video', () => {
    const { container } = render(
      <VideoDialog onClose={vi.fn()} onNavigate={vi.fn()} video={first} />,
    );
    const video = container.querySelector('video')!;

    fireEvent.play(video);
    fireEvent.pause(video);
    fireEvent.play(video);
    playback(video, 30);
    playback(video, 55);
    playback(video, 80);
    fireEvent.ended(video);
    fireEvent.ended(video);

    expect(milestones()).toEqual([
      [first.id, 'start'],
      [first.id, 'half'],
      [first.id, 'complete'],
    ]);
  });

  it('reports again for the next video and after reopening', () => {
    const onClose = vi.fn();
    const { container, getByLabelText, rerender } = render(
      <VideoDialog onClose={onClose} onNavigate={vi.fn()} video={first} />,
    );
    fireEvent.play(container.querySelector('video')!);

    rerender(
      <VideoDialog onClose={onClose} onNavigate={vi.fn()} video={second} />,
    );
    fireEvent.play(container.querySelector('video')!);

    fireEvent.click(getByLabelText('Close video'));
    fireEvent.play(container.querySelector('video')!);

    expect(milestones()).toEqual([
      [first.id, 'start'],
      [second.id, 'start'],
      [second.id, 'start'],
    ]);
  });
});
