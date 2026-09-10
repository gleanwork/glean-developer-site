import { createContext, useContext } from 'react';

interface PlaceholderValidation {
  bodyError?: string;
  clearBodyError: () => void;
  clearParameterError: (name: string) => void;
  parameterErrors: Record<string, string>;
}

const PlaceholderValidationContext = createContext<PlaceholderValidation>({
  clearBodyError: () => {},
  clearParameterError: () => {},
  parameterErrors: {},
});

export const PlaceholderValidationProvider =
  PlaceholderValidationContext.Provider;

export function usePlaceholderValidation(): PlaceholderValidation {
  return useContext(PlaceholderValidationContext);
}
