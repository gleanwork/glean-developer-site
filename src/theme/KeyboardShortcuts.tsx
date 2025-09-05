import { useEffect } from 'react';

export default function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Command+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        // Don't interfere if user is typing in an input field or textarea
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.getAttribute('contenteditable') === 'true')
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        // Find the Glean search input element
        const searchInput = document.getElementById(
          'glean-search-input',
        ) as HTMLInputElement;

        if (searchInput) {
          // Focus the search input, which should trigger the Glean search modal
          searchInput.focus();

          // If focusing doesn't trigger the modal, try clicking it
          searchInput.click();

          // Also try dispatching a focusin event to ensure the SDK detects it
          const focusEvent = new FocusEvent('focusin', {
            bubbles: true,
            cancelable: true,
          });
          searchInput.dispatchEvent(focusEvent);
        }
      }
    };

    // Add event listener to document with capture phase for better control
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
