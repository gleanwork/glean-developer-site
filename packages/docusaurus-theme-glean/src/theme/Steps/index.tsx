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
  /**
   * Makes this a step of an agent guide (docusaurus-plugin-mcp-server's
   * `AgentGuide`). Stable ID, unique in the guide; symptoms refer to it.
   */
  id?: string;
  /** `"user"` when only a person can do the step, such as signing in. */
  needs?: 'user';
  /** The step changes or deletes something; the agent asks first. */
  confirm?: boolean;
  /** Space-separated symptom IDs to offer when this step's check fails. */
  symptoms?: string;
}

// The plugin reads these attributes from the built page to compile agent
// guides. See docusaurus-plugin-mcp-server's agent guide format.
function guideStepAttributes({
  id,
  title,
  needs,
  confirm,
  symptoms,
}: Pick<StepProps, 'id' | 'title' | 'needs' | 'confirm' | 'symptoms'>) {
  if (!id) return {};
  return {
    'data-mcp-step': id,
    ...(title && { 'data-mcp-step-title': title }),
    ...(needs && { 'data-mcp-step-needs': needs }),
    ...(confirm && { 'data-mcp-step-confirm': '' }),
    ...(symptoms && { 'data-mcp-step-symptoms': symptoms }),
  };
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
  id,
  needs,
  confirm,
  symptoms,
}: StepProps) {
  // In a guide, the number and title are for readers. The compiled guide
  // numbers and titles steps itself, so it leaves labels out.
  const label = id ? { 'data-mcp-guide-label': '' } : {};

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
        return (
          <h2 className={styles.step__title} {...label}>
            {titleContent}
          </h2>
        );
      case 'h3':
        return (
          <h3 className={styles.step__title} {...label}>
            {titleContent}
          </h3>
        );
      default:
        return (
          <p className={styles.step__title} {...label}>
            {titleContent}
          </p>
        );
    }
  };

  return (
    <div
      className={styles.step}
      {...guideStepAttributes({ id, title, needs, confirm, symptoms })}
    >
      <div className={styles.step__indicator} {...label}>
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
