import {
  findFirstSidebarItemLink,
  useCurrentSidebarCategory,
} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import { Icon } from '@theme/Icons';
import getApiReferenceItems from './getApiReferenceItems';
import styles from './styles.module.css';

interface ApiReferenceListProps {
  categoryLabel: string;
}

export default function ApiReferenceList({
  categoryLabel,
}: ApiReferenceListProps) {
  const currentCategory = useCurrentSidebarCategory();
  const apiFamilies = getApiReferenceItems(currentCategory, categoryLabel);

  return (
    <nav aria-label={`${categoryLabel} families`}>
      <ul className={styles.list}>
        {apiFamilies.map((family) => {
          const href = findFirstSidebarItemLink(family);
          if (!href) {
            throw new Error(
              `Could not find a link for API family "${family.label}".`,
            );
          }

          const icon = family.customProps?.icon;
          const iconName = typeof icon === 'string' ? icon : undefined;
          const iconSet =
            family.customProps?.iconSet === 'glean' ? 'glean' : 'feather';
          const description = family.description?.trim();

          return (
            <li className={styles.item} key={family.label}>
              <Link
                className={`${styles.link} ${iconName ? styles.withIcon : ''} ${description ? styles.withDescription : ''}`}
                to={href}
              >
                {iconName && (
                  <span aria-hidden="true" className={styles.icon}>
                    <Icon
                      height={20}
                      iconSet={iconSet}
                      name={iconName}
                      width={20}
                    />
                  </span>
                )}
                <span className={styles.label}>{family.label}</span>
                {description && (
                  <span className={styles.description}>{description}</span>
                )}
                <span className={styles.endpointCount}>
                  {family.endpointCount}{' '}
                  {family.endpointCount === 1 ? 'endpoint' : 'endpoints'}
                </span>
                <svg
                  aria-hidden="true"
                  className={styles.arrow}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
