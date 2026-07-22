# ChatCustomizations

## Properties

### autocompletePosition?

```ts
optional autocompletePosition?: "above" | "below";
```

Controls where the autocomplete dropdown appears relative to the chat input box.
Only applies when `features.autocomplete` is enabled.

- 'above' - Autocomplete results appear above the input box.
- 'below' - Autocomplete results appear below the input box.

Default is 'above'.

***

### container?

```ts
optional container?: BoxCustomizations;
```

Customizations for the widget box.

***

### features?

```ts
optional features?: object;
```

Options to control which chat features or UI elements are displayed in the widget.

#### agentLibrary?

```ts
optional agentLibrary?: boolean;
```

The entry point to the agents library. Default is true.

#### agentMetadata?

```ts
optional agentMetadata?: boolean;
```

The element that shows metadata about an embedded agent. Default is true.

#### applicationLibrary?

```ts
optional applicationLibrary?: boolean;
```

The entry point to the AI apps library. Default is true.

#### autocomplete?

```ts
optional autocomplete?: boolean;
```

Autocomplete suggestions shown in the chat input. Default is false.

#### chatMenu?

```ts
optional chatMenu?: boolean;
```

The menu which displays chat history and other advanced features. Default is true.

#### chatSettings?

```ts
optional chatSettings?: boolean;
```

The button that leads to the chat settings menu. Default is true.

#### clearChat?

```ts
optional clearChat?: boolean;
```

The button that clears the current chat session. Default is true when chat menu is disabled.

#### createPrompt?

```ts
optional createPrompt?: boolean;
```

The button that opens prompt creation drawer. Default is true.

#### feedback?

```ts
optional feedback?: boolean;
```

The button that opens the feedback form. Default is true.

#### newChatButton?

```ts
optional newChatButton?: boolean;
```

The ability to start a new chat from the chat menu. Disabling this will remove the new chat button in the chat menu. Default is true.

#### promptLibrary?

```ts
optional promptLibrary?: boolean;
```

The entry point to the prompts library. Default is true.
