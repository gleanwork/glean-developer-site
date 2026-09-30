import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RecipeApiFlow } from '../../types/recipe';
import { recipeApiFlowSchema } from '../../types/recipe';
import ApiFlow, { buildModel, fieldPath } from './ApiFlow';
import styles from './ApiFlow.module.css';

const body = (value: unknown) => JSON.stringify(value, null, 2);

const flow: RecipeApiFlow = recipeApiFlowSchema.parse({
  intro: 'Keep the `run_id`.',
  inputs: [
    { value: 'agent_id', description: 'From the agent URL.' },
    { value: 'decision', description: 'APPROVE or REJECT.' },
  ],
  calls: [
    {
      title: 'Start a run',
      description: 'Start it.',
      sdkMethod: 'glean.agents.createRun',
      method: 'POST',
      path: '/api/agents/{agent_id}/runs',
      request: { source: 'flow/1.request.json', body: body({ stream: false }) },
      response: {
        source: 'flow/1.response.json',
        body: body({ run: { run_id: 'run-1', state: 'RUNNING' } }),
      },
      highlights: [
        { in: 'path', param: 'agent_id', value: 'agent_id' },
        { in: 'request', pointer: '/stream', note: 'One JSON body.' },
        {
          in: 'response',
          pointer: '/run/run_id',
          value: 'run_id',
          note: 'Keep this.',
        },
      ],
    },
    {
      title: 'Poll the run',
      description: 'Poll it.',
      sdkMethod: 'glean.agents.getRun',
      method: 'GET',
      path: '/api/agents/{agent_id}/runs/{run_id}',
      response: {
        source: 'flow/2.response.json',
        body: body({
          run: { pending_interactions: [{ interaction_id: 'call-1' }] },
        }),
      },
      highlights: [
        { in: 'path', param: 'agent_id', value: 'agent_id' },
        { in: 'path', param: 'run_id', value: 'run_id' },
        {
          in: 'response',
          pointer: '/run/pending_interactions/0/interaction_id',
          value: 'interaction_id',
          note: 'This exact call.',
        },
      ],
    },
    {
      title: 'Answer the run',
      description: 'Answer it.',
      sdkMethod: 'glean.agents.respondToRun',
      method: 'POST',
      path: '/api/agents/{agent_id}/responses',
      request: {
        source: 'flow/3.request.json',
        body: body({
          run_id: 'run-1',
          responses: [{ interaction_id: 'call-1', decision: 'APPROVE' }],
        }),
      },
      response: {
        source: 'flow/3.response.json',
        body: body({ run: { state: 'RUNNING' } }),
      },
      highlights: [
        { in: 'path', param: 'agent_id', value: 'agent_id' },
        { in: 'request', pointer: '/run_id', value: 'run_id' },
        {
          in: 'request',
          pointer: '/responses/0/interaction_id',
          value: 'interaction_id',
        },
        { in: 'request', pointer: '/responses/0/decision', value: 'decision' },
      ],
    },
  ],
});

const detail = () => screen.getByRole('heading', { level: 3 }).parentElement!;
const mark = (pointer: string) =>
  detail().querySelector(`[data-pointer="${pointer}"]`);

describe('buildModel', () => {
  it('links each used value to an input or the step that returned it', () => {
    const [start, poll, answer] = buildModel(flow);
    expect(start!.uses).toEqual([
      { value: 'agent_id', origin: { input: 'From the agent URL.' } },
    ]);
    expect(start!.returns).toEqual([{ value: 'run_id', usedBy: [1, 2] }]);
    expect(poll!.returns).toEqual([{ value: 'interaction_id', usedBy: [2] }]);
    expect(answer!.uses.map(({ value, origin }) => [value, origin])).toEqual([
      ['agent_id', { input: 'From the agent URL.' }],
      ['run_id', { step: 0 }],
      ['interaction_id', { step: 1 }],
      ['decision', { input: 'APPROVE or REJECT.' }],
    ]);
    expect(answer!.request).toMatchObject({ run_id: 'run-1' });
  });

  it('refuses a flow whose bodies were not materialized', () => {
    const [first, ...rest] = flow.calls;
    expect(() =>
      buildModel({
        ...flow,
        calls: [
          { ...first!, response: { source: 'flow/1.response.json' } },
          ...rest,
        ],
      }),
    ).toThrow(/not materialized for flow\/1.response.json/);
  });
});

it('reads JSON Pointers as field paths', () => {
  expect(fieldPath('/run/pending_interactions/0/interaction_id')).toBe(
    'run.pending_interactions[0].interaction_id',
  );
  expect(fieldPath('/a~1b/c~0d')).toBe('a/b.c~d');
});

describe('ApiFlow', () => {
  it('starts on the first call and marks the values it returns', () => {
    render(<ApiFlow flow={flow} />);

    expect(screen.getByText('run_id', { selector: 'p code' })).toBeTruthy();
    const track = screen.getByRole('list', { name: 'API calls in order' });
    expect(within(track).getAllByRole('button')).toHaveLength(3);
    expect(
      within(track).getByRole('button', { current: 'step' }).textContent,
    ).toContain('createRun');

    expect(screen.getByRole('heading', { name: 'Start a run' })).toBeTruthy();
    expect(mark('/run/run_id')?.textContent).toContain('"run-1"');
    expect(mark('/stream')?.className).toContain(styles.vNote);
    expect(detail().textContent).toContain('used by steps 2, 3');
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous' })).toHaveProperty(
      'disabled',
      true,
    );

    const lanes = within(
      screen.getByRole('list', { name: 'Values passed between calls' }),
    ).getAllByRole('listitem');
    expect(lanes.map((lane) => lane.textContent)).toEqual([
      'run_idreturned by step 1, used by steps 2, 3',
      'interaction_idreturned by step 2, used by step 3',
    ]);
    expect(lanes[0]!.className).not.toContain(styles.laneActive);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(lanes[0]!.className).toContain(styles.laneActive);
    expect(lanes[1]!.className).not.toContain(styles.laneActive);
  });

  it('shows where each carried value came from and animates its arrival', () => {
    render(<ApiFlow flow={flow} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.getByRole('heading', { name: 'Answer the run' }),
    ).toBeTruthy();
    const runId = mark('/run_id')!;
    const interaction = mark('/responses/0/interaction_id')!;
    const decision = mark('/responses/0/decision')!;
    expect(styles.arriving).toBeTruthy();
    expect(runId.className).toContain(styles.arriving);
    expect(interaction.className).toContain(styles.arriving);
    // An input doesn't come from an earlier response, so it doesn't arrive.
    expect(decision.className).not.toContain(styles.arriving);
    // Each value keeps one color wherever it appears.
    expect(runId.className).not.toBe(interaction.className);
    expect(detail().textContent).toContain('APPROVE or REJECT.');

    fireEvent.click(screen.getAllByRole('button', { name: 'from step 2' })[0]!);
    expect(screen.getByRole('heading', { name: 'Poll the run' })).toBeTruthy();
    expect(
      screen.getByText('{run_id}', { selector: 'span' }).className,
    ).toContain(styles.arriving);
    expect(detail().textContent).toContain('Request body: none.');
  });

  it('moves one call at a time with only Previous and Next', () => {
    render(<ApiFlow flow={flow} />);
    const controls = screen.getByText('Step 1 of 3').nextElementSibling!;
    expect(
      within(controls as HTMLElement)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Previous', 'Next']);

    const next = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByText('Step 3 of 3')).toBeTruthy();
    expect(next).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { name: 'Poll the run' })).toBeTruthy();
    expect(next).toHaveProperty('disabled', false);
  });

  it('turns every animation off for reduced motion', () => {
    const css = fs.readFileSync(
      path.join(import.meta.dirname, 'ApiFlow.module.css'),
      'utf8',
    );
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion'));
    for (const name of [
      '.detail',
      '.arriving',
      '.laneUseActive',
      '.laneActive .laneBar',
    ]) {
      expect(reduced).toContain(name);
    }
    expect(reduced).toMatch(/animation: none/);
  });
});
