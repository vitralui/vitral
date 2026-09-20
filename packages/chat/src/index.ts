/**
 * `@vitral/chat`: a conversation with no framework in it.
 *
 * - the engine: the runs a thread groups into, the sides, the initials, the
 *   roving focus and what a screen reader is told (also at `@vitral/chat/engine`);
 * - `createChat()`: a DOM renderer with streaming, attachments, tool calls,
 *   suggestions and the composer, which the framework components wrap;
 * - the classes and tokens are `@vitral/styles`' `chatStyle`, so a thread
 *   follows whatever preset the page is themed with.
 */
export * from './engine/index';
export { createChat, type ChatHandle } from './chat';
export { chatView, type ChatActions, type ViewContext } from './render/chat';
