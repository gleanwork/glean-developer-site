import React from 'react';
// Importing the original mapper + our components according to the Docusaurus doc
import MDXComponents from '@theme-original/MDXComponents';
import { Steps, Step } from '@site/src/components/Steps';
import Card from '@site/src/components/Card';
import CardGroup from '@site/src/components/CardGroup';
import Frame from '@site/src/components/Frame';
import FeatureFlag from '@site/src/components/FeatureFlag';
export default {
  // Reusing the default mapping
  ...MDXComponents,
  Steps,
  Step,
  Card,
  CardGroup,
  Frame,
  FeatureFlag,
};
