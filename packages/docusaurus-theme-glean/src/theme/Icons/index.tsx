import React, { useState, useEffect } from 'react';
import * as FeatherIcons from 'react-feather';
import useBaseUrl from '@docusaurus/useBaseUrl';

import { GLEAN_ICON_MAP, AVAILABLE_GLEAN_ICONS } from './glean-icon-manifest';
import type { GleanIconName } from './glean-icon-manifest';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

interface IconComponentProps extends IconProps {
  name: string;
  iconSet?: 'feather' | 'glean';
}

function GleanIcon({
  name,
  width,
  height,
  className,
  color,
}: IconProps & { name: string }) {
  const entry = GLEAN_ICON_MAP[name as GleanIconName];
  const iconUrl = useBaseUrl(entry ? `${entry.path}${entry.file}` : '');
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    if (!entry) return;
    fetch(iconUrl)
      .then((response) => response.text())
      .then((text) => {
        // Remove hardcoded fill and stroke attributes to allow CSS control
        // Also preserve viewBox and remove fixed width/height to allow proper scaling
        let cleanedSvg = text
          .replace(/fill="[^"]*"/g, 'fill="currentColor"')
          .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
          .replace(/<svg([^>]*)\s+width="[^"]*"/, '<svg$1')
          .replace(/<svg([^>]*)\s+height="[^"]*"/, '<svg$1')
          .replace(/<svg/, '<svg style="width: 100%; height: 100%"');

        // For stroke-only paths (no explicit fill): use fill="none" to preserve
        // the stroke-only design intent. Without this, the path gets filled solid.
        cleanedSvg = cleanedSvg.replace(
          /<path(?=[^>]*stroke=)(?![^>]*fill=)([^>]*)>/g,
          '<path$1 fill="none">',
        );
        // For paths with neither stroke nor fill: add fill="currentColor"
        cleanedSvg = cleanedSvg.replace(
          /<path(?![^>]*stroke=)(?![^>]*fill=)([^>]*)>/g,
          '<path$1 fill="currentColor">',
        );

        setSvgContent(cleanedSvg);
      })
      .catch((error) => {
        console.error(`Failed to load SVG icon: ${name}`, error);
      });
  }, [iconUrl, name, entry]);

  if (!svgContent) {
    return <div style={{ width, height }} />; // Placeholder while loading
  }

  const style: React.CSSProperties = {
    color: color || 'currentColor',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  // Only set inline dimensions if explicitly provided
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export function getIcon(
  iconName: string,
  iconSet: 'feather' | 'glean' = 'feather',
  props?: IconProps,
): React.ReactNode {
  if (iconSet === 'glean') {
    if (iconName in GLEAN_ICON_MAP) {
      return <GleanIcon name={iconName} {...props} />;
    }
    console.warn(
      `Glean icon "${iconName}" not found. Available icons:`,
      AVAILABLE_GLEAN_ICONS,
    );
    return null;
  }

  const FeatherIconComponent = FeatherIcons[
    iconName as keyof typeof FeatherIcons
  ] as React.ComponentType<any>;

  if (FeatherIconComponent) {
    const style: React.CSSProperties = {};
    if (props?.width !== undefined) style.width = props.width;
    if (props?.height !== undefined) style.height = props.height;

    return (
      <FeatherIconComponent
        size={props?.width || props?.height || 24}
        color={props?.color}
        className={props?.className}
        style={style}
      />
    );
  }

  console.warn(`Feather icon "${iconName}" not found.`);
  return null;
}

export function Icon({
  name,
  iconSet = 'feather',
  ...props
}: IconComponentProps) {
  return getIcon(name, iconSet, props) as React.ReactElement;
}

export { AVAILABLE_GLEAN_ICONS };
export type { GleanIconName };
