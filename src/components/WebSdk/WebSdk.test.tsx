import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrowserFrame from '../BrowserFrame';
import ComponentDemo from './ComponentDemo';
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
      <BrowserFrame url="portal.acme.internal">
        <div>widget goes here</div>
      </BrowserFrame>,
    );
    expect(screen.getByText('portal.acme.internal')).toBeInTheDocument();
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

const sdkMocks = vi.hoisted(() => ({
  renderChat: vi.fn(),
  renderSearchBox: vi.fn(),
  renderSearchResults: vi.fn(),
  renderRecommendations: vi.fn(),
  attach: vi.fn(),
  openSidebar: vi.fn(),
  renderSettings: vi.fn(),
}));

vi.mock('@gleanwork/web-sdk', () => ({
  ...sdkMocks,
  default: { renderSettings: sdkMocks.renderSettings },
}));

describe('ComponentDemo', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows the mock preview by default', () => {
    mockMatchMedia(true);
    render(
      <ComponentDemo kind="chat">
        <ChatPreview />
      </ComponentDemo>,
    );
    expect(screen.getByText('Illustrative preview')).toBeInTheDocument();
    expect(sdkMocks.renderChat).not.toHaveBeenCalled();
  });

  it('renders the live widget zero-config via app.glean.com', async () => {
    mockMatchMedia(true);
    render(
      <ComponentDemo kind="chat">
        <ChatPreview />
      </ComponentDemo>,
    );
    await userEvent.click(screen.getByText('Live — your instance'));
    await vi.waitFor(() => {
      expect(sdkMocks.renderChat).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ webAppUrl: 'https://app.glean.com' }),
      );
    });
    expect(sdkMocks.renderChat).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.not.objectContaining({ backend: expect.anything() }),
    );
  });

  it('rejects a non-Glean override URL', async () => {
    mockMatchMedia(true);
    render(
      <ComponentDemo kind="chat">
        <ChatPreview />
      </ComponentDemo>,
    );
    await userEvent.click(screen.getByText('Live — your instance'));
    await userEvent.click(screen.getByText('Custom domain or backend?'));
    await userEvent.type(
      screen.getByPlaceholderText(/Backend URL/),
      'https://evil.example.com/',
    );
    await userEvent.click(screen.getByText('Save'));
    expect(screen.getByText(/doesn't look like a Glean URL/)).toBeVisible();
  });

  it('jumps to Live from the mock caption and remembers the choice', async () => {
    mockMatchMedia(true);
    const first = render(
      <ComponentDemo kind="chat">
        <ChatPreview />
      </ComponentDemo>,
    );
    await userEvent.click(screen.getByText('Try it live \u2192'));
    await vi.waitFor(() => {
      expect(sdkMocks.renderChat).toHaveBeenCalled();
    });
    first.unmount();
    // A fresh demo block starts on Live thanks to the sticky preference.
    render(
      <ComponentDemo kind="settings">
        <SettingsPreview />
      </ComponentDemo>,
    );
    await vi.waitFor(() => {
      expect(sdkMocks.renderSettings).toHaveBeenCalled();
    });
    expect(screen.queryByText('Illustrative preview')).not.toBeInTheDocument();
  });

  it('keeps the caption plain outside a demo block', () => {
    mockMatchMedia(true);
    render(<ChatPreview />);
    expect(screen.getByText('Illustrative preview')).toBeInTheDocument();
    expect(screen.queryByText('Try it live \u2192')).not.toBeInTheDocument();
  });

  it('applies saved overrides to the live widget', async () => {
    mockMatchMedia(true);
    render(
      <ComponentDemo kind="settings">
        <SettingsPreview />
      </ComponentDemo>,
    );
    await userEvent.click(screen.getByText('Live — your instance'));
    await userEvent.click(screen.getByText('Custom domain or backend?'));
    await userEvent.type(
      screen.getByPlaceholderText(/Web app URL/),
      'https://acme.glean.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Backend URL/),
      'https://acme-be.glean.com/',
    );
    await userEvent.click(screen.getByText('Save'));
    await vi.waitFor(() => {
      expect(sdkMocks.renderSettings).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          webAppUrl: 'https://acme.glean.com',
          backend: 'https://acme-be.glean.com/',
        }),
      );
    });
    expect(screen.getByText(/Configured: acme\.glean\.com/)).toBeVisible();
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
