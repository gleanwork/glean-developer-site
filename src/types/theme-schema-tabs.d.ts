import type { ComponentType, ReactNode } from 'react';

declare const SchemaTabs: ComponentType<{
  children?: ReactNode;
  onChange?: (index: number) => void;
}>;

export default SchemaTabs;
