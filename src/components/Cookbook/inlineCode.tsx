import React from 'react';

/** Turn `` `identifier` `` spans in recipe JSON/MDX strings into <code>. */
export function renderInlineCode(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function isCodeLikeElement(element: React.ReactElement): boolean {
  const type = element.type;
  if (type === 'code' || type === 'pre') return true;
  const props = element.props as { language?: unknown };
  if (props.language != null) return true;
  if (typeof type === 'string') return false;
  const name =
    (typeof type === 'function' && (type.displayName || type.name)) || '';
  return /CodeBlock/i.test(name);
}

/**
 * MDX attribute strings and some inner bodies never go through markdown, so
 * backticks arrive as literal text. Walk strings (and host/MDX element
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
    return insideCode ? node : renderInlineCode(node);
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
