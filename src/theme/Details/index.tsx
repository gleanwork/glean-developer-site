import React, {
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
  RefObject,
} from 'react';
import clsx from 'clsx';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import useIsBrowser from '@docusaurus/useIsBrowser';
import styles from './styles.module.css';
import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect';

const DefaultAnimationEasing = 'ease-in-out';

/**
 * This hook is a very thin wrapper around a `useState`.
 */
export function useCollapsible({
  initialState,
}: {
  /** The initial state. Will be non-collapsed by default. */
  initialState?: boolean | (() => boolean);
}): {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  toggleCollapsed: () => void;
} {
  const [collapsed, setCollapsed] = useState(initialState ?? false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((expanded) => !expanded);
  }, []);

  return {
    collapsed,
    setCollapsed,
    toggleCollapsed,
  };
}

const CollapsedStyles = {
  overflow: 'hidden',
  height: '0px',
} as const;

const ExpandedStyles = {
  overflow: 'visible',
  height: 'auto',
} as const;

function applyCollapsedStyle(el: HTMLElement, collapsed: boolean) {
  if (collapsed && el.hasAttribute('hidden')) {
    return;
  }
  const collapsedStyles = collapsed ? CollapsedStyles : ExpandedStyles;
  el.style.overflow = collapsedStyles.overflow;
  el.style.height = collapsedStyles.height;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/*
Lex111: Dynamic transition duration is used in Material design, this technique
is good for a large number of items.
https://material.io/archive/guidelines/motion/duration-easing.html#duration-easing-dynamic-durations
https://github.com/mui-org/material-ui/blob/e724d98eba018e55e1a684236a2037e24bcf050c/packages/material-ui/src/styles/createTransitions.js#L40-L43
 */
function getAutoHeightDuration(height: number) {
  if (prefersReducedMotion()) {
    // Not using 0 because it prevents onTransitionEnd to fire and bubble up :/
    // See https://github.com/facebook/docusaurus/pull/8906
    return 1;
  }
  const constant = height / 36;
  return Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10);
}

type CollapsibleAnimationConfig = {
  duration?: number;
  easing?: string;
};

function useCollapseAnimation({
  collapsibleRef,
  collapsed,
  animation,
}: {
  collapsibleRef: RefObject<HTMLElement | null>;
  collapsed: boolean;
  animation?: CollapsibleAnimationConfig;
}) {
  const mounted = useRef(false);

  useEffect(() => {
    const el = collapsibleRef.current;
    if (!el) return;

    if (animation?.duration === 0 && !collapsed) {
      el.style.transition = 'none';
      el.style.overflow = 'visible';
      el.style.height = 'auto';
      void el.offsetHeight;
      el.style.transition = '';
      mounted.current = true;
      return;
    }

    function getTransitionStyles() {
      const height = el.scrollHeight;
      const duration = animation?.duration ?? getAutoHeightDuration(height);
      const easing = animation?.easing ?? DefaultAnimationEasing;
      return {
        transition: `height ${duration}ms ${easing}`,
        height: `${height}px`,
      };
    }

    function applyTransitionStyles() {
      const transitionStyles = getTransitionStyles();
      el.style.transition = transitionStyles.transition;
      el.style.height = transitionStyles.height;
    }

    // On mount, we just apply styles, no animated transition
    if (!mounted.current) {
      applyCollapsedStyle(el, collapsed);
      mounted.current = true;
      return undefined;
    }

    // eslint-disable-next-line react-compiler/react-compiler
    el.style.willChange = 'height';

    function startAnimation() {
      const animationFrame = requestAnimationFrame(() => {
        // When collapsing
        if (collapsed) {
          applyTransitionStyles();

          requestAnimationFrame(() => {
            el.style.height = CollapsedStyles.height;
            el.style.overflow = CollapsedStyles.overflow;
          });
        }
        // When expanding
        else {
          requestAnimationFrame(() => {
            el.style.overflow = 'visible';
            applyTransitionStyles();
          });
        }
      });

      return () => cancelAnimationFrame(animationFrame);
    }

    return startAnimation();
  }, [collapsibleRef, collapsed, animation]);
}

type CollapsibleElementType = React.ElementType<
  Pick<React.HTMLAttributes<unknown>, 'className' | 'onTransitionEnd' | 'style'>
>;

type CollapsibleBaseProps = {
  /** The actual DOM element to be used in the markup. */
  as?: CollapsibleElementType;
  /** Initial collapsed state. */
  collapsed: boolean;
  children: ReactNode;
  /** Configuration of animation, like `duration` and `easing` */
  animation?: CollapsibleAnimationConfig;
  /**
   * A callback fired when the collapse transition animation ends. Receives
   * the **new** collapsed state: e.g. when
   * expanding, `collapsed` will be `false`. You can use this for some "cleanup"
   * like applying new styles when the container is fully expanded.
   */
  onCollapseTransitionEnd?: (collapsed: boolean) => void;
  /** Class name for the underlying DOM element. */
  className?: string;
  __wrapperRef__?: RefObject<HTMLElement>;
};

function CollapsibleBase({
  as: As = 'div',
  collapsed,
  children,
  animation,
  onCollapseTransitionEnd,
  className,
  __wrapperRef__,
}: CollapsibleBaseProps) {
  const collapsibleRef = useRef<HTMLElement>(null);

  useCollapseAnimation({ collapsibleRef, collapsed, animation });

  useEffect(() => {
    if (__wrapperRef__) {
      __wrapperRef__.current = collapsibleRef.current;
    }
  }, [__wrapperRef__]);

  return (
    <As
      // @ts-expect-error: the "too complicated type" is produced from
      // "CollapsibleElementType" being a huge union
      ref={collapsibleRef as RefObject<never>} // Refs are contravariant, which is not expressible in TS
      onTransitionEnd={(e: React.TransitionEvent) => {
        if (e.propertyName !== 'height') {
          return;
        }

        if (collapsibleRef.current) {
          applyCollapsedStyle(collapsibleRef.current, collapsed);
        }
        onCollapseTransitionEnd?.(collapsed);
      }}
      className={className}
    >
      {children}
    </As>
  );
}

function CollapsibleLazy({ collapsed, ...props }: CollapsibleBaseProps) {
  const [mounted, setMounted] = useState(!collapsed);
  // Updated in effect so that first expansion transition can work
  const [lazyCollapsed, setLazyCollapsed] = useState(collapsed);

  useIsomorphicLayoutEffect(() => {
    if (!collapsed) {
      setMounted(true);
    }
  }, [collapsed]);

  useIsomorphicLayoutEffect(() => {
    if (mounted) {
      setLazyCollapsed(collapsed);
    }
  }, [mounted, collapsed]);

  return mounted ? (
    <CollapsibleBase {...props} collapsed={lazyCollapsed} />
  ) : null;
}

type CollapsibleProps = CollapsibleBaseProps & {
  /**
   * Delay rendering of the content till first expansion. Marked as required to
   * force us to think if content should be server-rendered or not. This has
   * perf impact since it reduces html file sizes, but could undermine SEO.
   * @see https://github.com/facebook/docusaurus/issues/4753
   */
  lazy: boolean;
};

/**
 * A headless component providing smooth and uniform collapsing behavior. The
 * component will be invisible (zero height) when collapsed. Doesn't provide
 * interactivity by itself: collapse state is toggled through props.
 */
export function Collapsible({ lazy, ...props }: CollapsibleProps): ReactNode {
  const Comp = lazy ? CollapsibleLazy : CollapsibleBase;
  return <Comp {...props} />;
}

function isInSummary(node: HTMLElement | null): boolean {
  if (!node) {
    return false;
  }
  return node.tagName === 'SUMMARY' || isInSummary(node.parentElement);
}

function hasParent(node: HTMLElement | null, parent: HTMLElement): boolean {
  if (!node) {
    return false;
  }
  return node === parent || hasParent(node.parentElement, parent);
}

export type DetailsProps = {
  /**
   * Summary is provided as props, optionally including the wrapping
   * `<summary>` tag
   */
  summary?: ReactElement | string;
} & ComponentProps<'details'>;

/**
 * A mostly un-styled `<details>` element with smooth collapsing. Provides some
 * very lightweight styles, but you should bring your UI.
 *
 * Enhanced: when collapsed, the inner content gets hidden="until-found" so
 * Chrome/Edge can auto-expand on Find-in-page. We also listen to `beforematch`
 * on the content to open on match.
 */
export default function Details({
  summary,
  children,
  ...props
}: DetailsProps): ReactNode {
  useBrokenLinks().collectAnchor(props.id);

  const isBrowser = useIsBrowser();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLElement>(null);
  const skipNextAnimRef = useRef(false);
  const { collapsed, setCollapsed } = useCollapsible({
    initialState: !props.open,
  });
  const [open, setOpen] = useState(props.open);

  const summaryElement = React.isValidElement(summary) ? (
    summary
  ) : (
    <summary>{summary ?? 'Details'}</summary>
  );

  // Keep hidden="until-found" in sync with collapsed state (must use attributes, not JSX boolean `hidden`)
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (collapsed) {
      el.setAttribute('hidden', 'until-found');
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('hidden');
      el.removeAttribute('aria-hidden');
    }
  }, [collapsed]);

  // Attach `beforematch` to the hidden content element itself
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onBeforeMatch = () => {
      skipNextAnimRef.current = true;
      el.removeAttribute('hidden');
      el.removeAttribute('aria-hidden');

      const wrapper = wrapperRef.current;
      if (wrapper) {
        wrapper.style.transition = 'none';
        wrapper.style.overflow = 'visible';
        wrapper.style.height = 'auto';
        void wrapper.offsetHeight;
      }
      if (detailsRef.current) {
        detailsRef.current.open = true;
      }

      const html = document.documentElement;
      const prevScrollBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';

      setCollapsed(false);
      setOpen(true);

      el.scrollIntoView({ block: 'center', inline: 'nearest' });

      setTimeout(() => {
        if (wrapper) {
          wrapper.style.transition = '';
        }
        html.style.scrollBehavior = prevScrollBehavior;
      }, 0);
    };
    el.addEventListener('beforematch', onBeforeMatch as any);
    return () => el.removeEventListener('beforematch', onBeforeMatch as any);
  }, [setCollapsed]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <details
      {...props}
      ref={detailsRef}
      open={open}
      data-collapsed={collapsed}
      className={clsx(
        styles.details,
        isBrowser && styles.isBrowser,
        props.className,
      )}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        // Prevent a double-click to highlight summary text
        if (isInSummary(target) && e.detail > 1) {
          e.preventDefault();
        }
      }}
      onClick={(e) => {
        e.stopPropagation(); // For isolation of multiple nested details/summary
        const target = e.target as HTMLElement;
        const shouldToggle =
          isInSummary(target) && hasParent(target, detailsRef.current!);
        if (!shouldToggle) {
          return;
        }
        e.preventDefault();
        if (collapsed) {
          setCollapsed(false);
          setOpen(true);
        } else {
          setCollapsed(true);
          // Don't setOpen(false) yet—let the close animation run
        }
      }}
    >
      {summaryElement}

      <Collapsible
        lazy={false}
        collapsed={collapsed}
        animation={skipNextAnimRef.current ? { duration: 0 } : undefined}
        onCollapseTransitionEnd={(newCollapsed) => {
          skipNextAnimRef.current = false;
          setCollapsed(newCollapsed);
          setOpen(!newCollapsed);
        }}
        __wrapperRef__={wrapperRef}
      >
        <div ref={contentRef} className={styles.collapsibleContent}>
          {children}
        </div>
      </Collapsible>
    </details>
  );
}
