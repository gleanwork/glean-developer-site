import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Step, Steps } from './index';

function stepElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(':scope > div > div'),
  );
}

describe('Step', () => {
  it('renders no agent guide attributes without an id', () => {
    const { container } = render(
      <Steps>
        <Step title="Install">Run the installer.</Step>
      </Steps>,
    );

    const html = container.innerHTML;
    expect(html).not.toContain('data-mcp-');
  });

  it('renders the agent guide step contract on the step element', () => {
    const { container } = render(
      <Steps>
        <Step
          id="sign-in"
          title="Sign in"
          needs="user"
          confirm
          symptoms="sign-in-loop wrong-server"
        >
          Sign in with SSO.
        </Step>
      </Steps>,
    );

    const [step] = stepElements(container);
    expect(step.dataset.mcpStep).toBe('sign-in');
    expect(step.dataset.mcpStepTitle).toBe('Sign in');
    expect(step.dataset.mcpStepNeeds).toBe('user');
    expect(step.dataset.mcpStepConfirm).toBe('');
    expect(step.dataset.mcpStepSymptoms).toBe('sign-in-loop wrong-server');
  });

  it('marks the number and title as labels, but not the body', () => {
    const { container } = render(
      <Steps>
        <Step id="sign-in" title="Sign in">
          Sign in with SSO.
        </Step>
      </Steps>,
    );

    const labels = Array.from(
      container.querySelectorAll<HTMLElement>('[data-mcp-guide-label]'),
    ).map((node) => node.textContent);
    expect(labels).toEqual(['1', 'Sign in']);
    expect(container.textContent).toContain('Sign in with SSO.');
  });

  it('leaves out attributes for props that are not set', () => {
    const { container } = render(
      <Steps>
        <Step id="verify">Ask a question.</Step>
      </Steps>,
    );

    const [step] = stepElements(container);
    expect(
      step.getAttributeNames().filter((n) => n.startsWith('data-')),
    ).toEqual(['data-mcp-step']);
  });
});
