import React, { useState, useEffect } from 'react';
import * as FeatherIcons from 'react-feather';
import useBaseUrl from '@docusaurus/useBaseUrl';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

// Registry of available Glean SVG icons in /static/img/glean/
const AVAILABLE_GLEAN_ICONS = [
  'agent',
  'chat',
  'tools',
  'platform',
  'sparkles',
  'mcp',
  'langchain',
  'plug',
  'pin',
  'golink',
  'verification',
  // Programming languages
  'python',
  'typescript',
  'go',
  'java',
  // Package registries
  'npm',
  'pypi',
  'maven',
] as const;

export type GleanIconName = (typeof AVAILABLE_GLEAN_ICONS)[number];

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
  const iconUrl = useBaseUrl(`/img/glean/${name}.svg`);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
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

        // Add fill="currentColor" to path elements that don't have fill specified
        cleanedSvg = cleanedSvg.replace(
          /<path(?![^>]*fill=)([^>]*)>/g,
          '<path$1 fill="currentColor">',
        );

        setSvgContent(cleanedSvg);
      })
      .catch((error) => {
        console.error(`Failed to load SVG icon: ${name}`, error);
      });
  }, [iconUrl, name]);

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
    if (AVAILABLE_GLEAN_ICONS.includes(iconName as GleanIconName)) {
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

// Export the list of available icons for reference
export { AVAILABLE_GLEAN_ICONS };
