# WebSdkChatEvent

```ts
type WebSdkChatEvent = 
  | {
  name: "chat:page_view";
}
  | {
  chatId: string | undefined;
  name: "chat:id_update";
}
  | {
  id?: string;
  name: "chat:location_update";
  type: ChatLocation;
}
  | {
  name: "chat:action_click";
  payload: string;
};
```

Chat events that can be emitted by the chat component
- chat:id_update and chat:location_update events may be sent multiple times for the same ID and the handler should be idempotent

## Union Members

### Type Literal

```ts
{
  name: "chat:page_view";
}
```

***

### Type Literal

```ts
{
  chatId: string | undefined;
  name: "chat:id_update";
}
```

| Name | Type | Description |
| ------ | ------ | ------ |
| `chatId` | `string` \| `undefined` | chatId can be undefined if the chatId is not yet available in current chat session, for example when the current chat is cleared. |
| `name` | `"chat:id_update"` | Deprecated: Use chat:location_update instead |

***

### Type Literal

```ts
{
  id?: string;
  name: "chat:location_update";
  type: ChatLocation;
}
```

| Name | Type | Description |
| ------ | ------ | ------ |
| `id?` | `string` | Can be undefined, for example when the current chat is cleared. |
| `name` | `"chat:location_update"` | - |
| `type` | `ChatLocation` | - |

***

### Type Literal

```ts
{
  name: "chat:action_click";
  payload: string;
}
```
