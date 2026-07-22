import { createContext } from 'react';

/** Provided by ComponentDemo so the mock's caption can offer a
 * "Try it live" jump into the Live tab. Null outside a demo block
 * (e.g. the overview gallery), where the caption stays plain. */
export const LiveTabContext = createContext<(() => void) | null>(null);
