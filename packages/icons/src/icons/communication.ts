// Communication: mail, chat, calls and notifications.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'communication';

export const bell: IconDef = { name: 'bell', category, tags: ['notification', 'alert', 'alarm'], body: '<path d="M6 16V10a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>' };
export const bellOff: IconDef = { name: 'bellOff', category, tags: ['mute notifications', 'silent'], body: '<path d="M8.5 4.8A6 6 0 0 1 18 10v4M18 18H4l2-2v-6c0-.9.2-1.8.6-2.6M10 21a2.2 2.2 0 0 0 4 0M3 3l18 18"/>' };
export const bellRing: IconDef = { name: 'bellRing', category, tags: ['ringing', 'alarm', 'notify'], body: '<path d="M6 16V10a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21a2.2 2.2 0 0 0 4 0M3 6.5A8 8 0 0 1 5.5 3M21 6.5A8 8 0 0 0 18.5 3"/>' };
export const bellDot: IconDef = { name: 'bellDot', category, tags: ['unread', 'new notification'], body: '<path d="M13.5 4.2A6 6 0 0 0 6 10v6l-2 2h16l-2-2v-3M10 21a2.2 2.2 0 0 0 4 0"/><circle cx="18" cy="6" r="3"/>' };
export const mail: IconDef = { name: 'mail', category, tags: ['email', 'envelope', 'message', 'letter'], body: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2.5 6l9.5 7 9.5-7"/>' };
export const mailOpen: IconDef = { name: 'mailOpen', category, tags: ['read email', 'envelope'], body: '<path d="M2 10l10-7 10 7v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2.5 10.5l9.5 6.5 9.5-6.5"/>' };
export const mailPlus: IconDef = { name: 'mailPlus', category, tags: ['new email', 'compose'], body: '<path d="M22 12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9M2.5 6l9.5 7 9.5-7M19 15v6M16 18h6"/>' };
export const mailCheck: IconDef = { name: 'mailCheck', category, tags: ['email sent', 'verified'], body: '<path d="M22 12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9M2.5 6l9.5 7 9.5-7M15.5 18l2 2 4-4"/>' };
export const send: IconDef = { name: 'send', category, tags: ['paper plane', 'submit', 'message'], body: '<path d="M21.5 2.5L2.5 10l7.5 4 4 7.5zM21.5 2.5L10 14"/>' };
export const inbox: IconDef = { name: 'inbox', category, tags: ['mail', 'tray', 'messages'], body: '<path d="M2 13h6l2 3h4l2-3h6M5.4 4.9L2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-8.1A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8.9z"/>' };
export const atSign: IconDef = { name: 'atSign', category, tags: ['email', 'mention', 'at'], body: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>' };
export const messageSquare: IconDef = { name: 'messageSquare', category, tags: ['chat', 'comment', 'bubble'], body: '<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>' };
export const messageSquareText: IconDef = { name: 'messageSquareText', category, tags: ['chat', 'comment', 'text'], body: '<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M7 9h10M7 13h6"/>' };
export const messageSquarePlus: IconDef = { name: 'messageSquarePlus', category, tags: ['new comment', 'add chat'], body: '<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M12 8v6M9 11h6"/>' };
export const messageCircle: IconDef = { name: 'messageCircle', category, tags: ['chat', 'bubble', 'talk'], body: '<path d="M7.5 20.5A9.5 9.5 0 1 0 3.5 16.5L2.5 21.5z"/>' };
export const messageCircleDots: IconDef = { name: 'messageCircleDots', category, tags: ['typing', 'chat', 'conversation'], body: '<path d="M7.5 20.5A9.5 9.5 0 1 0 3.5 16.5L2.5 21.5z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>' };
export const messagesSquare: IconDef = { name: 'messagesSquare', category, tags: ['conversation', 'chat', 'forum'], body: '<path d="M14 3H4a2 2 0 0 0-2 2v10l3.5-3H14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM19 8h1a2 2 0 0 1 2 2v11l-3.5-3H10a2 2 0 0 1-2-2v-1"/>' };
export const phone: IconDef = { name: 'phone', category, tags: ['call', 'telephone', 'contact'], body: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>' };
export const phoneCall: IconDef = { name: 'phoneCall', category, tags: ['calling', 'ringing'], body: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/><path d="M14 2.5a7.5 7.5 0 0 1 7.5 7.5M14 6a4 4 0 0 1 4 4"/>' };
export const phoneIncoming: IconDef = { name: 'phoneIncoming', category, tags: ['receive call'], body: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/><path d="M21 3l-6 6M15 4v5h5"/>' };
export const phoneOutgoing: IconDef = { name: 'phoneOutgoing', category, tags: ['make call'], body: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/><path d="M15 9l6-6M16 3h5v5"/>' };
export const phoneOff: IconDef = { name: 'phoneOff', category, tags: ['hang up', 'end call'], body: '<path d="M10.7 13.3a11 11 0 0 0 4.8 3.2L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 7.3 16.7M4.2 12.4A17 17 0 0 1 3 5a2 2 0 0 1 2-2h3l2 5-2.5 1.5M3 21L21 3"/>' };
export const voicemail: IconDef = { name: 'voicemail', category, tags: ['message', 'recording'], body: '<circle cx="6.5" cy="12" r="4"/><circle cx="17.5" cy="12" r="4"/><path d="M6.5 16h11"/>' };
export const megaphone: IconDef = { name: 'megaphone', category, tags: ['announce', 'broadcast', 'marketing'], body: '<path d="M3 10v4a1 1 0 0 0 1 1h3l9 5V4L7 9H4a1 1 0 0 0-1 1zM7 15l1.5 6h3L10 15.5M19 9.5a3 3 0 0 1 0 5"/>' };
export const rss: IconDef = { name: 'rss', category, tags: ['feed', 'subscribe', 'blog'], body: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle fill="currentColor" cx="5" cy="19" r="1"/>' };
export const wifi: IconDef = { name: 'wifi', category, tags: ['wireless', 'internet', 'signal'], body: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>' };
export const wifiOff: IconDef = { name: 'wifiOff', category, tags: ['offline', 'no connection'], body: '<path d="M2 8.5a15 15 0 0 1 5-2.9M11 5a15 15 0 0 1 11 3.5M5 12.5a10 10 0 0 1 4.3-2.4M16.5 10.9a10 10 0 0 1 2.5 1.6M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M3 3l18 18"/>' };
export const antenna: IconDef = { name: 'antenna', category, tags: ['signal', 'broadcast', 'radio tower'], body: '<path d="M12 10v12M8 22h8M8.5 6.5a5 5 0 0 0 0 7M15.5 6.5a5 5 0 0 1 0 7M5.5 3.5a9.5 9.5 0 0 0 0 13M18.5 3.5a9.5 9.5 0 0 1 0 13"/><circle cx="12" cy="10" r="1"/>' };
export const contact: IconDef = { name: 'contact', category, tags: ['address book', 'card', 'person'], body: '<rect x="3" y="2" width="17" height="20" rx="2"/><path d="M1.5 7h3M1.5 12h3M1.5 17h3"/><circle cx="11.5" cy="10" r="3"/><path d="M6.5 18a5 5 0 0 1 10 0"/>' };
export const reply: IconDef = { name: 'reply', category, tags: ['answer', 'respond', 'back'], body: '<path d="M9 17l-5-5 5-5M4 12h11a5 5 0 0 1 5 5v2"/>' };
export const replyAll: IconDef = { name: 'replyAll', category, tags: ['answer everyone'], body: '<path d="M8 17l-5-5 5-5M12 17l-5-5 5-5M7 12h9a5 5 0 0 1 5 5v2"/>' };
export const forward: IconDef = { name: 'forward', category, tags: ['pass on', 'send on'], body: '<path d="M15 17l5-5-5-5M20 12H9a5 5 0 0 0-5 5v2"/>' };
export const videoCall: IconDef = { name: 'videoCall', category, tags: ['video call', 'conference', 'meeting'], body: '<rect x="2" y="5" width="13" height="14" rx="2"/><path d="M15 10l6-3.5v11L15 14"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5 16a3.5 3.5 0 0 1 7 0"/>' };
