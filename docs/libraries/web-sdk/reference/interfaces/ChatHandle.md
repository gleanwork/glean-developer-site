# ChatHandle

## Properties

### off

```ts
off: (eventName, handler) => void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `eventName` | \| `"chat:page_view"` \| `"chat:id_update"` \| `"chat:location_update"` \| `"chat:action_click"` |
| `handler` | (`event`) => `void` |

#### Returns

`void`

***

### on

```ts
on: (eventName, handler) => void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `eventName` | \| `"chat:page_view"` \| `"chat:id_update"` \| `"chat:location_update"` \| `"chat:action_click"` |
| `handler` | (`event`) => `void` |

#### Returns

`void`
