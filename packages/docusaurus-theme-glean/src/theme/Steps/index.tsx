import React from 'react';
import { Menu, LinkIcon, Play } from 'lucide-react';
import styles from './styles.module.css';

interface StepsProps {
  children: React.ReactElement<StepProps>[];
  titleSize?: 'p' | 'h2' | 'h3';
}

interface StepProps {
  title?: string;
  children: string | React.ReactNode;
  icon?: string | React.ReactNode;
  iconType?:
    | 'regular'
    | 'solid'
    | 'light'
    | 'thin'
    | 'sharp-solid'
    | 'duotone'
    | 'brands';
  stepNumber?: number;
  titleSize?: 'p' | 'h2' | 'h3';
}

const iconMap: { [key: string]: React.ReactNode } = {
  menu: <Menu />,
  link: <LinkIcon />,
  play: <Play />,
  key: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M7 17a5.007 5.007 0 0 0 4.898-4H14v2h2v-2h2v3h2v-3h1v-2h-9.102A5.007 5.007 0 0 0 7 7c-2.757 0-5 2.243-5 5s2.243 5 5 5zM7 9c1.691 0 3 1.309 3 3s-1.309 3-3 3-3-1.309-3-3 1.309-3 3-3z" />
    </svg>
  ),
};

export function Steps({ children, titleSize = 'p' }: StepsProps) {
  return (
    <div className={styles.steps}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            stepNumber: child.props.stepNumber || index + 1,
            titleSize: child.props.titleSize || titleSize,
            key: index,
          });
        }
        return child;
      })}
    </div>
  );
}

export function Step({
  title,
  children,
  icon,
  iconType = 'regular',
  stepNumber = 1,
  titleSize = 'p',
}: StepProps) {
  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      const IconComponent = iconMap[icon];
      return IconComponent ? (
        <div className={styles.step__custom_icon}>{IconComponent}</div>
      ) : null;
    }

    return <div className={styles.step__custom_icon}>{icon}</div>;
  };

  const renderTitle = () => {
    if (!title) return null;

    const titleContent = (
      <>
        {renderIcon()}
        {title}
      </>
    );

    switch (titleSize) {
      case 'h2':
        return <h2 className={styles.step__title}>{titleContent}</h2>;
      case 'h3':
        return <h3 className={styles.step__title}>{titleContent}</h3>;
      default:
        return <p className={styles.step__title}>{titleContent}</p>;
    }
  };

  return (
    <div className={styles.step}>
      <div className={styles.step__indicator}>
        <div className={styles.step__number}>{stepNumber}</div>
        <div className={styles.step__line}></div>
      </div>
      <div className={styles.step__content}>
        {renderTitle()}
        <div className={styles.step__body}>{children}</div>
      </div>
    </div>
  );
}
