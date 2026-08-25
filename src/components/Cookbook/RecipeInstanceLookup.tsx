import React, { useId, useState } from 'react';
import { getIcon } from '@gleanwork/docusaurus-theme-glean/Icons';
import TenantProfileControl from '@site/src/components/TenantProfile';
import { useTenantApiPersonalizationEnabled } from '@site/src/lib/tenantPersonalizationFlag';
import {
  instanceNameFromApiUrl,
  tenantApiUrlFromState,
  useTenantProfile,
} from '@site/src/lib/tenantProfile';
import tenantStyles from '../TenantProfile/styles.module.css';
import styles from './RecipeLayout.module.css';

function InstanceNameCopy(): React.ReactElement | null {
  const state = useTenantProfile();
  const apiUrl = tenantApiUrlFromState(state);
  const instanceName = apiUrl ? instanceNameFromApiUrl(apiUrl) : undefined;
  const [copied, setCopied] = useState(false);
  const instanceId = useId();

  if (!apiUrl) return null;

  if (!instanceName) {
    return (
      <p className={tenantStyles.help}>
        This API URL is not a standard <code>*-be.glean.com</code> host. Copy{' '}
        <code>Instance name</code> from{' '}
        <code>https://app.glean.com/admin/about-glean</code>.
      </p>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(instanceName);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access may be unavailable; the name remains selectable.
    }
  };

  return (
    <div className={`${tenantStyles.control} ${tenantStyles.compact}`}>
      <div className={tenantStyles.configuredField}>
        <label className={tenantStyles.configuredLabel} htmlFor={instanceId}>
          Instance name
        </label>
        <div className={tenantStyles.copyField}>
          <input
            aria-label="Instance name"
            id={instanceId}
            readOnly
            value={instanceName}
          />
          <button
            aria-label={copied ? 'Instance name copied' : 'Copy instance name'}
            className={tenantStyles.copyButton}
            onClick={copy}
            title={copied ? 'Copied' : 'Copy to clipboard'}
            type="button"
          >
            {getIcon(copied ? 'Check' : 'Copy', 'feather', {
              width: 16,
              height: 16,
              color: 'currentColor',
            })}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Email-to-instance lookup already used on authentication pages. Cookbook
 * paste recipes need the slug (`acme`), so this also copies Instance name
 * when the API URL is a standard Glean-hosted origin.
 */
export default function RecipeInstanceLookup(): React.ReactElement | null {
  const enabled = useTenantApiPersonalizationEnabled();
  if (!enabled) return null;

  return (
    <div className={styles.instanceLookup}>
      <TenantProfileControl
        compact
        heading="Find your instance name"
        description="Enter your work email. We look up your Glean API URL and show the instance name to paste into the prompt."
      />
      <InstanceNameCopy />
    </div>
  );
}
