import React, { useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import styles from './PlatformErrorsIndex.module.css';

interface SearchablePlatformError {
  code: string;
  slug: string;
  status: number;
  title: string;
  remediation: {
    meaning: string;
    commonCauses: string[];
  };
}

function searchableText(error: SearchablePlatformError): string {
  return [
    error.code,
    error.title,
    error.status,
    error.remediation?.meaning,
    ...(error.remediation?.commonCauses ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function PlatformErrorsIndex({
  errors,
}: {
  errors: SearchablePlatformError[];
}): React.ReactElement {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const missingSlug = params.get('missing');
  const [query, setQuery] = useState(params.get('q') ?? '');

  const filteredErrors = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return errors;

    return errors.filter((error) => {
      const text = searchableText(error);
      return terms.every((term) => text.includes(term));
    });
  }, [errors, query]);

  return (
    <main>
      <h1>Platform API Errors</h1>
      <p>
        Find the stable <code>ProblemDetail.code</code> returned by the Platform
        API, then open its reference page for likely causes, remediation, retry
        guidance, and an example response.
      </p>
      {missingSlug && (
        <div className={styles.missingNotice}>
          <strong>{missingSlug}</strong> does not have a dedicated error page
          yet. Search by the response code, HTTP status, or a keyword from the
          error message.
        </div>
      )}
      <div className={styles.searchPanel}>
        <label htmlFor="platform-error-search">Find an error</label>
        <p id="platform-error-search-help">
          Enter a code such as <code>invalid_cursor</code>, an HTTP status such
          as <code>429</code>, or a keyword such as <code>permissions</code>.
        </p>
        <input
          aria-describedby="platform-error-search-help platform-error-search-count"
          autoComplete="off"
          id="platform-error-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search error codes and descriptions"
          type="search"
          value={query}
        />
      </div>
      <p
        aria-live="polite"
        className={styles.resultCount}
        id="platform-error-search-count"
      >
        {filteredErrors.length === errors.length
          ? `${errors.length} documented errors`
          : `${filteredErrors.length} of ${errors.length} documented errors`}
      </p>
      <table>
        <thead>
          <tr>
            <th>Error code</th>
            <th>HTTP status</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          {filteredErrors.map((error) => (
            <tr key={error.code}>
              <td>
                <Link
                  aria-label={`${error.code}: ${error.title}`}
                  className={styles.errorLink}
                  title={error.title}
                  to={`/errors/${error.slug}`}
                >
                  <code>{error.code}</code>
                </Link>
              </td>
              <td>
                <code className={styles.status}>{error.status}</code>
              </td>
              <td>{error.remediation.meaning}</td>
            </tr>
          ))}
          {filteredErrors.length === 0 && (
            <tr>
              <td className={styles.emptyState} colSpan={3}>
                No documented errors match “{query}”. Try the exact response
                code, HTTP status, or fewer keywords.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
