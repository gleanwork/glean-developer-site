import React, { useMemo, useState } from 'react';
import type {
  RecipeApiFlow,
  RecipeApiFlowCall,
  RecipeApiFlowHighlight,
} from '../../types/recipe';
import { renderInlineMarkup } from './inlineMarkup';
import styles from './ApiFlow.module.css';

const PALETTE = [
  styles.v0,
  styles.v1,
  styles.v2,
  styles.v3,
  styles.v4,
  styles.v5,
];

type BodyHighlight = Extract<RecipeApiFlowHighlight, { pointer: string }>;
type PathHighlight = Extract<RecipeApiFlowHighlight, { param: string }>;
type Side = 'request' | 'response';

/** Where a value used by a call comes from. */
type Origin = { input: string } | { step: number };

interface Note {
  number: number;
  side: Side;
  highlight: BodyHighlight;
  origin?: Origin;
}

interface CallModel {
  call: RecipeApiFlowCall;
  request?: unknown;
  response: unknown;
  paths: PathHighlight[];
  notes: Note[];
  /** Values this call reads from an input or an earlier response. */
  uses: { value: string; origin: Origin }[];
  /** Values this call's response returns for a later call. */
  returns: { value: string; usedBy: number[] }[];
}

function cx(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

function parseBody(call: RecipeApiFlowCall, side: Side): unknown {
  const body = call[side];
  if (!body) return undefined;
  if (body.body === undefined) {
    throw new Error(`API flow ${side} was not materialized for ${body.source}`);
  }
  return JSON.parse(body.body) as unknown;
}

/** `/run/pending_interactions/0/id` → `run.pending_interactions[0].id` */
export function fieldPath(pointer: string): string {
  return pointer
    .split('/')
    .slice(1)
    .map((raw) => raw.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce(
      (path, token) =>
        /^\d+$/.test(token)
          ? `${path}[${token}]`
          : path
            ? `${path}.${token}`
            : token,
      '',
    );
}

/**
 * Derives the flow's links from its highlights: which input or earlier step
 * each used value comes from, and which later steps use each returned value.
 * The cookbook build has already checked that these links are complete.
 */
export function buildModel(flow: RecipeApiFlow): CallModel[] {
  const inputs = new Map(
    (flow.inputs ?? []).map((input) => [input.value, input.description]),
  );
  const latest = new Map<string, number>();

  const models = flow.calls.map((call, step): CallModel => {
    const origin = (value: string): Origin => {
      const earlier = latest.get(value);
      if (earlier !== undefined) return { step: earlier };
      return { input: inputs.get(value) ?? '' };
    };
    const uses = new Map<string, Origin>();
    const paths: PathHighlight[] = [];
    const notes: Note[] = [];
    const returns: string[] = [];

    for (const highlight of call.highlights) {
      if (highlight.in === 'path') {
        paths.push(highlight);
        if (!uses.has(highlight.value)) {
          uses.set(highlight.value, origin(highlight.value));
        }
        continue;
      }
      const note: Note = {
        number: notes.length + 1,
        side: highlight.in,
        highlight,
      };
      if (highlight.value && highlight.in === 'request') {
        note.origin = origin(highlight.value);
        if (!uses.has(highlight.value)) {
          uses.set(highlight.value, note.origin);
        }
      }
      if (highlight.value && highlight.in === 'response') {
        returns.push(highlight.value);
      }
      notes.push(note);
    }
    for (const value of returns) latest.set(value, step);

    return {
      call,
      request: parseBody(call, 'request'),
      response: parseBody(call, 'response'),
      paths,
      notes,
      uses: [...uses].map(([value, from]) => ({ value, origin: from })),
      returns: returns.map((value) => ({ value, usedBy: [] })),
    };
  });

  models.forEach((model, step) => {
    for (const { value, origin } of model.uses) {
      if ('step' in origin) {
        models[origin.step]!.returns.find(
          (returned) => returned.value === value,
        )?.usedBy.push(step);
      }
    }
  });
  return models;
}

function colorsFor(models: CallModel[]): (value?: string) => string {
  const order: string[] = [];
  for (const model of models) {
    for (const value of [
      ...model.uses.map((use) => use.value),
      ...model.returns.map((returned) => returned.value),
    ]) {
      if (!order.includes(value)) order.push(value);
    }
  }
  return (value) =>
    value === undefined || !order.includes(value)
      ? styles.vNote!
      : PALETTE[order.indexOf(value) % PALETTE.length]!;
}

function Chip({
  value,
  color,
  active,
}: {
  value: string;
  color: string;
  active?: boolean;
}): React.ReactElement {
  return (
    <code className={cx(styles.chip, color, active && styles.chipActive)}>
      {value}
    </code>
  );
}

interface JsonLine {
  depth: number;
  content: React.ReactNode;
  /** The innermost highlighted object or array this line belongs to. */
  block?: Note;
  /** Set on the first line of a highlighted object or array. */
  pointer?: string;
}

function escapeToken(key: string): string {
  return key.replaceAll('~', '~0').replaceAll('/', '~1');
}

const isCarried = (note: Note) =>
  note.origin !== undefined && 'step' in note.origin;

/**
 * Lays JSON out one line per row, so a highlighted object or array can shade
 * its whole block while a highlighted scalar is marked inline.
 */
export function jsonLines(
  value: unknown,
  marks: Map<string, Note>,
  colorOf: (value?: string) => string,
): JsonLine[] {
  const lines: JsonLine[] = [];
  const blocks: Note[] = [];
  const marker = (note: Note) => (
    <span className={styles.marker} aria-hidden="true">
      {note.number}
    </span>
  );

  const visit = (
    item: unknown,
    pointer: string,
    depth: number,
    label: React.ReactNode,
    comma: string,
  ) => {
    const note = pointer ? marks.get(pointer) : undefined;
    const children =
      item !== null && typeof item === 'object'
        ? Array.isArray(item)
          ? item.map((child, index) => [String(index), child] as const)
          : Object.entries(item)
        : [];

    if (children.length === 0) {
      const literal =
        item !== null && typeof item === 'object' ? (
          Array.isArray(item) ? (
            '[]'
          ) : (
            '{}'
          )
        ) : (
          <span
            className={
              typeof item === 'string' ? styles.jsonString : styles.jsonLiteral
            }
          >
            {JSON.stringify(item)}
          </span>
        );
      lines.push({
        depth,
        block: blocks.at(-1),
        content: (
          <>
            {note ? (
              <mark
                className={cx(
                  styles.mark,
                  colorOf(note.highlight.value),
                  isCarried(note) && styles.arriving,
                )}
                data-pointer={pointer}
              >
                {label}
                {literal}
                {marker(note)}
              </mark>
            ) : (
              <>
                {label}
                {literal}
              </>
            )}
            {comma}
          </>
        ),
      });
      return;
    }

    const [open, close] = Array.isArray(item) ? ['[', ']'] : ['{', '}'];
    if (note) blocks.push(note);
    lines.push({
      depth,
      block: blocks.at(-1),
      pointer: note ? pointer : undefined,
      content: (
        <>
          {label}
          {open}
          {note ? marker(note) : null}
        </>
      ),
    });
    children.forEach(([key, child], index) => {
      visit(
        child,
        `${pointer}/${escapeToken(key)}`,
        depth + 1,
        Array.isArray(item) ? null : (
          <>
            <span className={styles.jsonKey}>{JSON.stringify(key)}</span>
            {': '}
          </>
        ),
        index < children.length - 1 ? ',' : '',
      );
    });
    lines.push({
      depth,
      block: blocks.at(-1),
      content: (
        <>
          {close}
          {comma}
        </>
      ),
    });
    if (note) blocks.pop();
  };

  visit(value, '', 0, null, '');
  return lines;
}

function JsonPanel({
  label,
  body,
  side,
  notes,
  colorOf,
}: {
  label: string;
  body: unknown;
  side: Side;
  notes: Note[];
  colorOf: (value?: string) => string;
}): React.ReactElement {
  const onSide = notes.filter((note) => note.side === side);
  const marks = new Map(onSide.map((note) => [note.highlight.pointer, note]));
  return (
    <figure className={styles.panel}>
      <figcaption className={styles.panelLabel}>{label}</figcaption>
      <pre className={styles.json}>
        <code>
          {jsonLines(body, marks, colorOf).map((line, index) => (
            <span
              key={index}
              className={cx(
                styles.line,
                line.block && styles.lineMarked,
                line.block && colorOf(line.block.highlight.value),
                line.block && isCarried(line.block) && styles.arriving,
              )}
              data-pointer={line.pointer}
            >
              {'  '.repeat(line.depth)}
              {line.content}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

function PathTemplate({
  model,
  colorOf,
}: {
  model: CallModel;
  colorOf: (value?: string) => string;
}): React.ReactElement {
  return (
    <code className={styles.path}>
      {model.call.path.split(/(\{[^{}]+\})/).map((part, index) => {
        const param = /^\{(.+)\}$/.exec(part)?.[1];
        const highlight = model.paths.find((path) => path.param === param);
        if (!highlight) return part;
        const carried = model.uses.find((use) => use.value === highlight.value);
        return (
          <span
            key={index}
            className={cx(
              styles.param,
              colorOf(highlight.value),
              carried && 'step' in carried.origin && styles.arriving,
            )}
          >
            {part}
          </span>
        );
      })}
    </code>
  );
}

function OriginLabel({
  step,
  onStep,
}: {
  step: number;
  onStep: (step: number) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={styles.originLink}
      onClick={() => onStep(step)}
    >
      from step {step + 1}
    </button>
  );
}

const sdkName = (call: RecipeApiFlowCall) =>
  call.sdkMethod?.split('.').at(-1) ?? call.title;

const steps = (list: number[]) =>
  `step${list.length > 1 ? 's' : ''} ${list.map((step) => step + 1).join(', ')}`;

export default function ApiFlow({
  flow,
}: {
  flow: RecipeApiFlow;
}): React.ReactElement {
  const models = useMemo(() => buildModel(flow), [flow]);
  const colorOf = useMemo(() => colorsFor(models), [models]);
  const inputs = flow.inputs ?? [];
  const [active, setActive] = useState(0);
  const last = models.length - 1;
  const model = models[active]!;

  const go = (step: number) => setActive(Math.max(0, Math.min(last, step)));

  // One lane per returned value, from the step that returns it to the last
  // step that uses it.
  const lanes = models.flatMap((item, from) =>
    item.returns
      .filter(({ usedBy }) => usedBy.length > 0)
      .map(({ value, usedBy }) => ({ value, from, usedBy })),
  );
  const uses = model.uses.filter(({ origin }) => 'step' in origin);
  const supplied = model.uses.filter(({ origin }) => 'input' in origin);

  return (
    <div className={styles.flow}>
      <p className={styles.intro}>{renderInlineMarkup(flow.intro)}</p>

      <div
        className={styles.track}
        style={{ '--steps': models.length } as React.CSSProperties}
      >
        <ol className={styles.nodes} aria-label="API calls in order">
          {models.map((item, step) => (
            <li key={step} className={styles.nodeItem}>
              <button
                type="button"
                className={cx(
                  styles.node,
                  step === active && styles.nodeActive,
                )}
                aria-current={step === active ? 'step' : undefined}
                onClick={() => go(step)}
              >
                <span className={styles.nodeHead}>
                  <span className={styles.nodeNumber}>Step {step + 1}</span>
                  <span
                    className={styles.method}
                    data-method={item.call.method}
                  >
                    {item.call.method}
                  </span>
                </span>
                <span className={styles.nodeName}>{sdkName(item.call)}</span>
              </button>
            </li>
          ))}
        </ol>
        {lanes.length > 0 ? (
          <ul className={styles.lanes} aria-label="Values passed between calls">
            {lanes.map(({ value, from, usedBy }) => (
              <li
                key={value}
                className={cx(
                  styles.lane,
                  colorOf(value),
                  usedBy.includes(active) && styles.laneActive,
                )}
                style={
                  {
                    '--from': from,
                    '--to': Math.max(...usedBy),
                  } as React.CSSProperties
                }
              >
                <span className={styles.laneBar} aria-hidden="true" />
                <span
                  className={styles.laneStop}
                  style={{ '--at': from } as React.CSSProperties}
                  aria-hidden="true"
                />
                {usedBy.map((step) => (
                  <span
                    key={step}
                    className={cx(
                      styles.laneStop,
                      styles.laneUse,
                      step === active && styles.laneUseActive,
                    )}
                    style={{ '--at': step } as React.CSSProperties}
                    aria-hidden="true"
                  />
                ))}
                <code className={cx(styles.chip, styles.laneLabel)}>
                  {value}
                </code>
                <span className={styles.srOnly}>
                  returned by step {from + 1}, used by {steps(usedBy)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {inputs.length > 0 ? (
        <dl className={styles.inputs}>
          {inputs.map((input) => (
            <div className={styles.input} key={input.value}>
              <dt>
                <Chip value={input.value} color={colorOf(input.value)} />
              </dt>
              <dd>{renderInlineMarkup(input.description)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className={styles.toolbar}>
        <div className={styles.stepCount} aria-live="polite">
          Step {active + 1} of {models.length}
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            onClick={() => go(active - 1)}
            disabled={active === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className={styles.control}
            onClick={() => go(active + 1)}
            disabled={active === last}
          >
            Next
          </button>
        </div>
      </div>

      <div className={styles.detail} key={active}>
        <h3 className={styles.title}>{renderInlineMarkup(model.call.title)}</h3>
        <p className={styles.request}>
          <span className={styles.method} data-method={model.call.method}>
            {model.call.method}
          </span>
          <PathTemplate model={model} colorOf={colorOf} />
          {model.call.sdkMethod ? (
            <code className={styles.sdk}>{model.call.sdkMethod}</code>
          ) : null}
        </p>
        <p className={styles.description}>
          {renderInlineMarkup(model.call.description)}
        </p>

        <dl className={styles.links}>
          {uses.length > 0 ? (
            <div>
              <dt>From earlier responses</dt>
              <dd>
                {uses.map(({ value, origin }) =>
                  'step' in origin ? (
                    <span key={value} className={styles.link}>
                      <Chip value={value} color={colorOf(value)} />
                      <OriginLabel step={origin.step} onStep={go} />
                    </span>
                  ) : null,
                )}
              </dd>
            </div>
          ) : null}
          {supplied.length > 0 ? (
            <div>
              <dt>You supply</dt>
              <dd>
                {supplied.map(({ value }) => (
                  <span key={value} className={styles.link}>
                    <Chip value={value} color={colorOf(value)} />
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          {model.returns.length > 0 ? (
            <div>
              <dt>Returns</dt>
              <dd>
                {model.returns.map(({ value, usedBy }) => (
                  <span key={value} className={styles.link}>
                    <Chip value={value} color={colorOf(value)} />
                    <span className={styles.origin}>
                      used by {steps(usedBy)}
                    </span>
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.panels}>
          {model.request !== undefined ? (
            <JsonPanel
              label="Request body"
              body={model.request}
              side="request"
              notes={model.notes}
              colorOf={colorOf}
            />
          ) : (
            <div className={styles.panelLabel}>
              Request body: none. {model.call.method} sends only the path.
            </div>
          )}
          <JsonPanel
            label="Response body"
            body={model.response}
            side="response"
            notes={model.notes}
            colorOf={colorOf}
          />
        </div>

        {model.notes.length > 0 ? (
          <ol className={styles.notes}>
            {model.notes.map((note) => {
              const { highlight } = note;
              const input =
                note.origin && 'input' in note.origin ? note.origin.input : '';
              return (
                <li key={`${note.side}${highlight.pointer}`}>
                  <span
                    className={cx(styles.marker, colorOf(highlight.value))}
                    aria-hidden="true"
                  >
                    {note.number}
                  </span>
                  <span className={styles.noteBody}>
                    <span className={styles.noteField}>
                      {note.side === 'request' ? 'Request' : 'Response'}{' '}
                      <code>{fieldPath(highlight.pointer)}</code>
                    </span>
                    {renderInlineMarkup(highlight.note ?? input)}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
