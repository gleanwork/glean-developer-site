import OriginalBody from '@theme-original/ApiExplorer/Body';
import { useTypedSelector } from '@theme/ApiItem/hooks';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';

import { usePlaceholderValidation } from '../placeholderValidation';

export default function Body(
  props: ComponentProps<typeof OriginalBody>,
): React.ReactElement {
  const body = useTypedSelector((state: any) => state.body);
  const previousBody = useRef(body);
  const { bodyError, clearBodyError } = usePlaceholderValidation();

  useEffect(() => {
    if (previousBody.current !== body) {
      clearBodyError();
      previousBody.current = body;
    }
  }, [body, clearBodyError]);

  return (
    <>
      <OriginalBody {...props} />
      {bodyError && (
        <div className="openapi-explorer__input-error" role="alert">
          {bodyError}
        </div>
      )}
    </>
  );
}
