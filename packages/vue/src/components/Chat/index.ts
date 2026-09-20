import ChatVue from './Chat.vue';
import { ChatEmpty, ChatFooter, ChatHeader, ChatLauncher } from './parts';

/**
 * The conversation, and as properties the parts a template composes it from:
 * `<Chat.Header>`, `<Chat.Empty>`… `Root` is the chat itself.
 */
export const Chat = /* @__PURE__ */ Object.assign(ChatVue, {
    Root: ChatVue,
    Header: ChatHeader,
    Footer: ChatFooter,
    Empty: ChatEmpty,
    Launcher: ChatLauncher
});

export { ChatHeader, ChatFooter, ChatEmpty, ChatLauncher };
export type * from './types';
