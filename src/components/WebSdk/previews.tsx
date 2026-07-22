import React from 'react';
import BrowserFrame from '../BrowserFrame';
import styles from './previews.module.css';
import {
  MockAutocomplete,
  MockChat,
  MockModalSearch,
  MockRecommendations,
  MockSearchResults,
  MockSettings,
  MockSidebar,
} from './mocks';
import { MockCaption, PortalPage } from './mocks/primitives';
import { PORTAL_URL } from './mocks/demoData';

function Preview({
  url = PORTAL_URL,
  children,
}: {
  url?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={styles.preview}>
      <BrowserFrame url={url}>{children}</BrowserFrame>
      <MockCaption />
    </div>
  );
}

/** Hero preview for the search-page (autocomplete + results) doc. */
export function AutocompletePreview(): React.ReactElement {
  return (
    <Preview url={`${PORTAL_URL}/search`}>
      <div className={styles.searchPage}>
        <MockAutocomplete />
        <MockSearchResults />
      </div>
    </Preview>
  );
}

/** Hero preview for the modal-search doc. */
export function ModalSearchPreview(): React.ReactElement {
  return (
    <Preview>
      <PortalPage bodyBars={6} />
      <MockModalSearch />
    </Preview>
  );
}

/** Hero preview for the sidebar doc. */
export function SidebarPreview(): React.ReactElement {
  return (
    <Preview url={`${PORTAL_URL}/runbooks/payments`}>
      <div className={styles.sidebarStage}>
        <PortalPage bodyBars={6} />
        <MockSidebar />
      </div>
    </Preview>
  );
}

/** Hero preview for the chat doc. */
export function ChatPreview(): React.ReactElement {
  return (
    <Preview url={`${PORTAL_URL}/assistant`}>
      <div className={styles.chatStage}>
        <MockChat />
      </div>
    </Preview>
  );
}

/** Hero preview for the recommendations doc. */
export function RecommendationsPreview(): React.ReactElement {
  return (
    <Preview url={`${PORTAL_URL}/runbooks/payments`}>
      <MockRecommendations />
    </Preview>
  );
}

/** Hero preview for the settings doc. */
export function SettingsPreview(): React.ReactElement {
  return (
    <Preview url={`${PORTAL_URL}/settings`}>
      <MockSettings />
    </Preview>
  );
}
