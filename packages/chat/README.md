# @vitral/chat

A conversation with no framework in it: the engine and a DOM renderer, which
the Vue, React and Angular components wrap.

```ts
import { createChat } from '@vitral/chat';

const chat = createChat(element, {
    messages: [{ id: 1, role: 'assistant', content: 'How can I help?' }],
    on: {
        send: ({ text }) => answer(text),
        'draft-change': (draft) => chat.update({ draft })
    }
});

chat.update({ messages });
chat.destroy();
```

It draws a real list — one item a message, runs of one speaker grouped so a
thread reads as speech rather than as rows. The log is one tab stop with a
roving focus inside it (the arrows move a message, Home and End jump), so a
thread of two hundred messages does not bury the composer behind two hundred
tab presses.

A message marked `streaming` grows in place with a caret after the last
character, and is announced only once it settles: a live region that changed on
every token would say nothing a screen reader could follow.

The thread follows the newest message as messages arrive, but only while the
reader is already at the bottom — scrolling someone away from what they were
reading is the one thing an auto-scrolling log must never do. When they have
scrolled off, a button offers to take them back.

## Shapes

`variant` decides the shape, not the colours:

| variant | for |
| --- | --- |
| `basic` | the plain thread, for a page that is the conversation |
| `messenger` | two people: both sides get a bubble and an avatar |
| `copilot` | a narrow column beside the work; no bubbles, no avatars |
| `agent` | an assistant that uses tools, so the steps it took are shown |
| `widget` | a launcher and a panel that opens over the page |
| `captions` | a running transcript, for speech as it is recognised |

The classes and tokens are `@vitral/styles`' `chatStyle`, so a thread follows
whatever preset the page is themed with.
