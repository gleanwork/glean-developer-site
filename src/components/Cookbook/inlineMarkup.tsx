import React from 'react';

// Recipe prose supports two inline marks: `code` and **bold**. Bold may
// contain code. Code is matched first, so asterisks inside backticks stay
// literal.
const CODE = '`[^`]+`';
const BOLD = `\\*\\*(?:[^*\`]|${CODE})+?\\*\\*`;
const INLINE_MARK = new RegExp(`(${CODE}|${BOLD})`);
const INLINE_MARK_GLOBAL = new RegExp(`${CODE}|${BOLD}`, 'g');

/**
 * Drop the `code` and **bold** marks for places that take plain text, such
 * as `<meta>` content, where markup would be shown literally.
 */
export function stripInlineMarkup(text: string): string {
  return text.replace(INLINE_MARK_GLOBAL, (mark) =>
    mark.startsWith('`')
      ? mark.slice(1, -1)
      : stripInlineMarkup(mark.slice(2, -2)),
  );
}

/**
 * Turn `` `identifier` `` spans into <code> and `**label**` spans into
 * <strong> in recipe JSON/MDX strings.
 */
export function renderInlineMarkup(text: string): React.ReactNode {
  // With a capture group, split puts every matched mark at an odd index.
  return text.split(INLINE_MARK).map((part, index) => {
    if (index % 2 === 0) return part;
    if (part.startsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <strong key={index}>{renderInlineMarkup(part.slice(2, -2))}</strong>;
  });
}

function isCodeLikeElement(element: React.ReactElement): boolean {
  const type = element.type;
  if (type === 'code' || type === 'pre') return true;
  const props = element.props as { language?: unknown };
  if (props.language != null) return true;
  if (typeof type !== 'function') return false;
  const component = type as { displayName?: string; name?: string };
  return /CodeBlock/i.test(component.displayName ?? component.name ?? '');
}

/**
 * MDX attribute strings and some inner bodies never go through markdown, so
 * `code` and **bold** marks arrive as literal text. Walk strings (and host/MDX element
 * children) without rewriting fenced code.
 */
export function renderProse(node: React.ReactNode): React.ReactNode {
  return renderProseNode(node, false);
}

function renderProseNode(
  node: React.ReactNode,
  insideCode: boolean,
): React.ReactNode {
  if (node == null || typeof node === 'boolean') return node;
  if (typeof node === 'number') return node;
  if (typeof node === 'string') {
    return insideCode ? node : renderInlineMarkup(node);
  }
  if (Array.isArray(node)) {
    return React.Children.map(node, (child) =>
      renderProseNode(child, insideCode),
    );
  }
  if (React.isValidElement(node)) {
    if (isCodeLikeElement(node)) return node;
    const children = (node.props as { children?: React.ReactNode }).children;
    if (children === undefined) return node;
    return React.cloneElement(
      node,
      undefined,
      renderProseNode(children, insideCode),
    );
  }
  return node;
}
