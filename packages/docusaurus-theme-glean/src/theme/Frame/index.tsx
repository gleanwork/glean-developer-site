import React from 'react';
import type { CSSProperties } from 'react';
import styles from './styles.module.css';

interface FrameProps {
  children?: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  caption?: string;
}

const Frame: React.FC<FrameProps> = ({
  children,
  className = '',
  style,
  caption,
}) => {
  return (
    <div className={styles.frameWrapper} style={style}>
      <div className={`${styles.frame} ${className}`}>{children}</div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
};

export default Frame;
