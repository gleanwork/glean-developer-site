export const EXPERIMENTAL_HEADER_NAME = 'X-Glean-Include-Experimental';

export function isVisibleInExplorer(parameter: {
  in?: string;
  name?: string;
}): boolean {
  if (parameter.in !== 'header') {
    return true;
  }
  if (typeof parameter.name !== 'string') {
    return true;
  }
  return (
    parameter.name.toLowerCase() !== EXPERIMENTAL_HEADER_NAME.toLowerCase()
  );
}
