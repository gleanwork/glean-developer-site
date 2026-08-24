import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ServerObject } from 'docusaurus-plugin-openapi-docs/src/openapi/types';

export interface State {
  value?: ServerObject;
  options: ServerObject[];
}

const initialState = {} as State;

export const slice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    // Preserve the pinned theme's behavior for its original Server component.
    setServer: (state, action: PayloadAction<string>) => {
      state.value = state.options.find(
        (server) => server.url === JSON.parse(action.payload).url,
      );
    },
    setServerVariable: (state, action: PayloadAction<string>) => {
      if (state.value?.variables) {
        const parsedPayload = JSON.parse(action.payload);
        state.value.variables[parsedPayload.key].default = parsedPayload.value;
      }
    },
    // The enabled personalization adapter may normalize a legacy {instance}
    // option into a full {serverUrl} option that is not in the original list.
    setCustomServer: (state, action: PayloadAction<string>) => {
      state.value = JSON.parse(action.payload) as ServerObject;
    },
  },
});

export const { setServer, setServerVariable, setCustomServer } = slice.actions;
export default slice.reducer;
