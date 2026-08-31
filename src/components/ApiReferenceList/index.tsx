import {
  findFirstSidebarItemLink,
  useCurrentSidebarCategory,
} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
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

          return (
            <li className={styles.item} key={family.label}>
              <Link className={styles.link} to={href}>
                <span className={styles.label}>{family.label}</span>
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
