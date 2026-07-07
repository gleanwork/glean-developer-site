import { useLocation } from '@docusaurus/router';
import styles from './PlatformErrorsIndex.module.css';

export default function PlatformErrorsIndex({ errors }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const missingSlug = params.get('missing');

  return (
    <main>
      <h1>Platform API Errors</h1>
      <p>
        Glean Platform API errors use ProblemDetail responses with stable
        machine-readable codes. Each page explains the public error category,
        common causes, and safe remediation guidance.
      </p>
      {missingSlug && (
        <div className={styles.missingNotice}>
          <strong>{missingSlug}</strong> does not have a dedicated error page
          yet. Use this index to find the closest documented Platform API error
          code.
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Status</th>
            <th>Title</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error) => (
            <tr key={error.code}>
              <td>
                <a href={`/errors/${error.slug}`}>
                  <code>{error.code}</code>
                </a>
              </td>
              <td>{error.status}</td>
              <td>{error.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
