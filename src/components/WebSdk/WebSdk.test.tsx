import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BrowserFrame from '../BrowserFrame';
import {
  MockAutocomplete,
  MockChat,
  MockModalSearch,
  MockRecommendations,
  MockSearchBox,
  MockSearchResults,
  MockSettings,
  MockSidebar,
} from './mocks';
import {
  AutocompletePreview,
  ChatPreview,
  ModalSearchPreview,
  RecommendationsPreview,
  SettingsPreview,
  SidebarPreview,
} from './previews';
import WebSdkOverview from './WebSdkOverview';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe('BrowserFrame', () => {
  it('renders the URL pill and its children', () => {
    render(
      <BrowserFrame url="portal.internal/engineering">
        <div>widget goes here</div>
      </BrowserFrame>,
    );
    expect(screen.getByText('portal.internal/engineering')).toBeInTheDocument();
    expect(screen.getByText('widget goes here')).toBeInTheDocument();
  });
});

describe('Web SDK mocks', () => {
  it('MockSearchBox shows the demo query', () => {
    render(<MockSearchBox />);
    expect(screen.getByText('payments service runbook')).toBeInTheDocument();
  });

  it('MockAutocomplete shows doc suggestions and filter hints', () => {
    render(<MockAutocomplete />);
    expect(
      screen.getByText('Payments Service — Deploy & Rollback Runbook'),
    ).toBeInTheDocument();
    expect(screen.getByText('from:')).toBeInTheDocument();
  });

  it('MockSearchResults shows chips, tabs, and result titles', () => {
    render(<MockSearchResults />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('All filters')).toBeInTheDocument();
    expect(
      screen.getByText('Payments Service — Deploy & Rollback Runbook'),
    ).toBeInTheDocument();
  });

  it('MockModalSearch shows the modal with results', () => {
    render(<MockModalSearch />);
    expect(screen.getByText('payments-service')).toBeInTheDocument();
  });

  it('MockSidebar shows the assistant panel with the Chat/Search toggle', () => {
    render(<MockSidebar />);
    expect(screen.getByText('Ask Assistant anything')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Reference current page')).toBeInTheDocument();
  });

  it('MockRecommendations shows the recommended rows', () => {
    render(<MockRecommendations />);
    expect(screen.getByText('Recommended for this page')).toBeInTheDocument();
    expect(
      screen.getByText('PAY-2114: Canary alarms during deploy'),
    ).toBeInTheDocument();
  });

  it('MockSettings shows the connector grid with connect states', () => {
    render(<MockSettings />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Connected').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Connect').length).toBeGreaterThan(0);
  });

  it('MockChat shows the answer immediately when reduced motion is set', () => {
    mockMatchMedia(true);
    render(<MockChat />);
    expect(
      screen.getByText('Who owns the payments service?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/owned by the Payments Platform team/),
    ).toBeInTheDocument();
  });

  it('MockChat types before answering when motion is allowed', () => {
    mockMatchMedia(false);
    render(<MockChat />);
    expect(
      screen.queryByText(/owned by the Payments Platform team/),
    ).not.toBeInTheDocument();
  });
});

describe('WebSdkOverview', () => {
  it('renders the banner, gallery tiles, and honest badges', () => {
    mockMatchMedia(true);
    render(<WebSdkOverview />);
    expect(screen.getByText('Embed Glean anywhere')).toBeInTheDocument();
    expect(screen.getByText('Glean Chat')).toBeInTheDocument();
    expect(screen.getByText('Modal Search')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Deprecated')).toBeInTheDocument();
    expect(
      screen.getByText('npm install @gleanwork/web-sdk'),
    ).toBeInTheDocument();
  });
});

describe('Web SDK previews', () => {
  it.each([
    ['AutocompletePreview', AutocompletePreview],
    ['ModalSearchPreview', ModalSearchPreview],
    ['SidebarPreview', SidebarPreview],
    ['ChatPreview', ChatPreview],
    ['RecommendationsPreview', RecommendationsPreview],
    ['SettingsPreview', SettingsPreview],
  ] as const)(
    '%s renders with the illustrative-preview caption',
    (_, Preview) => {
      mockMatchMedia(true);
      render(<Preview />);
      expect(screen.getByText('Illustrative preview')).toBeInTheDocument();
    },
  );
});
