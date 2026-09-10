import { describe, expect, it } from 'vitest';

import {
  bodyPlaceholder,
  firstParameterPlaceholder,
  parameterPlaceholder,
} from './unresolvedPlaceholders';

describe('parameterPlaceholder', () => {
  it('matches only the complete parameter token', () => {
    expect(parameterPlaceholder('agent_id', '{agent_id}')).toBe('{agent_id}');
    expect(parameterPlaceholder('agent_id', 'prefix {agent_id}')).toBeUndefined();
    expect(parameterPlaceholder('agent_id', '{skill_id}')).toBeUndefined();
  });

  it('finds encoded parameter values that still match the example', () => {
    expect(
      firstParameterPlaceholder([
        {
          example: '{field}',
          in: 'query',
          name: 'field',
          value: '%7Bfield%7D',
        },
      ]),
    ).toEqual({ name: 'field', value: '{field}' });
  });
});

describe('bodyPlaceholder', () => {
  it('finds a string token matching its property name', () => {
    expect(
      bodyPlaceholder('{"inputs":{"repository":"{repository}"}}'),
    ).toBe('{repository}');
  });

  it('finds matching tokens in arrays', () => {
    expect(bodyPlaceholder('{"items":["{items}"]}')).toBe('{items}');
  });

  it.each([
    '{"input":"summarize {topic}"}',
    '{"name":"{repository}"}',
    '{"input":"use ${var}"}',
    '{"nested":{"value":"ordinary"}}',
    '{"not valid"',
  ])('ignores non-placeholder body %s', (source) => {
    expect(bodyPlaceholder(source)).toBeUndefined();
  });
});
