// Brands: the marks people look for in a share row, a sign-in button or a
// stack badge. Drawn to this set's own rules — the 24×24 grid, 2-unit round
// strokes, no fill — rather than traced from anyone's artwork, so they sit
// beside the rest instead of looking pasted in.
//
// A logo is its owner's trademark. These are recognisable outline marks for
// interface use; they are not the official artwork, and a brand's own
// guidelines still say where and how its mark may be shown.
import type { IconDef } from '../types';

const category = 'brands';

// ---- social

export const linkedin: IconDef = {
    name: 'linkedin',
    category,
    tags: ['social', 'network', 'profile', 'work'],
    body: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.5 10.5v6M11.5 16.5v-6M11.5 13.2a2.6 2.6 0 0 1 5.2 0v3.3"/><path d="M7.5 7.6v.01"/>'
};

export const facebook: IconDef = {
    name: 'facebook',
    category,
    tags: ['social', 'meta', 'share'],
    body: '<circle cx="12" cy="12" r="9"/><path d="M14.8 8.4h-1.4a2 2 0 0 0-2 2V21M9.4 13.2h5"/>'
};

export const instagram: IconDef = {
    name: 'instagram',
    category,
    tags: ['social', 'photos', 'meta'],
    body: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8v.01"/>'
};

export const youtube: IconDef = {
    name: 'youtube',
    category,
    tags: ['social', 'video', 'channel'],
    body: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.3 9.2l5.4 2.8-5.4 2.8z"/>'
};

export const whatsapp: IconDef = {
    name: 'whatsapp',
    category,
    tags: ['social', 'chat', 'messaging', 'meta'],
    body: '<path d="M3.2 20.8l1.4-4.2A8.6 8.6 0 1 1 7.8 19.6z"/><path d="M9 9.6c0 3 2.4 5.4 5.4 5.4l.9-1.4-1.9-.9-.9.9a5.2 5.2 0 0 1-1.8-1.8l.9-.9-.9-1.9z"/>'
};

export const telegram: IconDef = {
    name: 'telegram',
    category,
    tags: ['social', 'chat', 'messaging'],
    body: '<path d="M21 4L2.8 10.9l5.4 1.9L21 4 10.9 14.1 21 4z"/><path d="M8.2 12.8L10.9 21l3.2-4.6M8.2 12.8V19l2.7-2"/>'
};

export const x: IconDef = {
    name: 'x',
    category,
    tags: ['social', 'twitter', 'post', 'share'],
    body: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8l8 8M16 8l-8 8"/>'
};

export const threads: IconDef = {
    name: 'threads',
    category,
    tags: ['social', 'meta', 'posts'],
    body: '<path d="M16 8.4A4.6 4.6 0 0 0 12 6.5C8.5 6.5 6.5 9 6.5 12s2 5.5 5.5 5.5c3 0 4.6-1.6 4.6-3.4 0-2-1.8-3-4-3-1.7 0-2.9.8-2.9 2 0 1 .9 1.7 2 1.7 1.7 0 2.6-1.4 2.6-3.6"/><path d="M12 3a9 9 0 1 0 0 18"/>'
};

export const pinterest: IconDef = {
    name: 'pinterest',
    category,
    tags: ['social', 'boards', 'pins'],
    body: '<circle cx="12" cy="12" r="9"/><path d="M10 21l2.2-8.4M9.4 11.2a3 3 0 1 1 3.9 3.3c-1 .3-2-.2-2.3-1"/>'
};

export const reddit: IconDef = {
    name: 'reddit',
    category,
    tags: ['social', 'forum', 'community'],
    body: '<circle cx="12" cy="13.5" r="7.5"/><circle cx="20.5" cy="7.5" r="1.8"/><path d="M12 6l1.2-3.2 3.6 1M9 13v.01M15 13v.01M9.4 16.4a4.4 4.4 0 0 0 5.2 0"/>'
};

export const twitch: IconDef = {
    name: 'twitch',
    category,
    tags: ['social', 'streaming', 'live', 'games'],
    body: '<path d="M4 3h16v11l-4 4h-3.5L9 21H7v-3H4z"/><path d="M11 8v4M15.5 8v4"/>'
};

export const tiktok: IconDef = {
    name: 'tiktok',
    category,
    tags: ['social', 'video', 'short'],
    body: '<path d="M14 3v12.5a4 4 0 1 1-4-4c.4 0 .7 0 1 .1"/><path d="M14 3a5.5 5.5 0 0 0 5.5 5.5"/>'
};

export const discord: IconDef = {
    name: 'discord',
    category,
    tags: ['social', 'chat', 'community', 'games'],
    body: '<path d="M8.5 5.5A13 13 0 0 1 12 5c1.2 0 2.4.2 3.5.5L17 4c2 .8 3.4 2.2 4 4 .7 2.5.7 5 0 7.5-.6 1.8-2 3.2-4 4l-1.2-2M8.5 5.5L7 4C5 4.8 3.6 6.2 3 8c-.7 2.5-.7 5 0 7.5.6 1.8 2 3.2 4 4l1.2-2"/><path d="M9.5 12.5v.01M14.5 12.5v.01M8.2 16.4a9 9 0 0 0 7.6 0"/>'
};

export const mastodon: IconDef = {
    name: 'mastodon',
    category,
    tags: ['social', 'fediverse', 'posts'],
    body: '<path d="M18.5 14.5c-1.8.6-4 .9-6.5.9s-4.7-.3-6.5-.9"/><path d="M5 14.5C4 12.5 4 9 4.5 7 5 5 7 3.5 12 3.5S19 5 19.5 7c.5 2 .5 5.5-.5 7.5"/><path d="M8 12V9a2 2 0 0 1 4 0v3M12 9a2 2 0 0 1 4 0v3"/><path d="M7 17.5c1.5 1.7 3.4 2.3 5.5 2.3 1.5 0 3-.3 4-.8"/>'
};

export const bluesky: IconDef = {
    name: 'bluesky',
    category,
    tags: ['social', 'posts', 'butterfly'],
    body: '<path d="M12 11.5C10 7.5 6.5 4.5 4.5 4.5c-1.4 0-2 1-2 2.5 0 1.8.8 5.5 1.6 6.6.8 1 2.2 1.4 4 1.4 1.2 0 2.6.3 3.9 2.5 1.3-2.2 2.7-2.5 3.9-2.5 1.8 0 3.2-.4 4-1.4.8-1.1 1.6-4.8 1.6-6.6 0-1.5-.6-2.5-2-2.5-2 0-5.5 3-7.5 7z"/>'
};

// ---- development

export const github: IconDef = {
    name: 'github',
    category,
    tags: ['code', 'repository', 'git', 'open source'],
    body: '<path d="M9 19.5c-4 1.2-4-2.2-5.5-2.7M14.5 21.5v-3.3a2.9 2.9 0 0 0-.8-2.2c2.6-.3 5.3-1.3 5.3-5.8a4.5 4.5 0 0 0-1.2-3.1 4.2 4.2 0 0 0-.1-3.1s-1-.3-3.2 1.2a11 11 0 0 0-5.8 0C6.5 3.7 5.5 4 5.5 4a4.2 4.2 0 0 0-.1 3.1A4.5 4.5 0 0 0 4.2 10.2c0 4.5 2.7 5.5 5.3 5.8a2.9 2.9 0 0 0-.8 2.2v3.3"/>'
};

export const gitlab: IconDef = {
    name: 'gitlab',
    category,
    tags: ['code', 'repository', 'git', 'ci'],
    body: '<path d="M12 21L3 12.8 4.6 3.5l2.8 7h9.2l2.8-7L21 12.8z"/><path d="M4.6 10.5h14.8"/>'
};

export const npm: IconDef = {
    name: 'npm',
    category,
    tags: ['package', 'registry', 'node', 'javascript'],
    body: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 18V10h3.5v8M10 10v4M14 18V10h3.5v4"/>'
};

export const nodejs: IconDef = {
    name: 'nodejs',
    category,
    tags: ['node', 'server', 'javascript', 'runtime'],
    body: '<path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z"/><path d="M9.5 14.5c0 1.2 1 2 2.5 2s2.5-.8 2.5-2-1-1.6-2.5-1.9-2.5-.7-2.5-1.9 1-2 2.5-2 2.5.8 2.5 2"/>'
};

export const vuejs: IconDef = {
    name: 'vuejs',
    category,
    tags: ['vue', 'framework', 'javascript'],
    body: '<path d="M2.5 4.5h4L12 14l5.5-9.5h4L12 21z"/><path d="M6.5 4.5h3L12 9l2.5-4.5h3"/>'
};

export const react: IconDef = {
    name: 'react',
    category,
    tags: ['framework', 'javascript', 'ui'],
    body: '<circle cx="12" cy="12" r="2"/><path d="M2.5 12.0A9.5 3.8 0 1 0 21.5 12.0A9.5 3.8 0 1 0 2.5 12.0"/><path d="M7.25 3.77A9.5 3.8 60 1 0 16.75 20.23A9.5 3.8 60 1 0 7.25 3.77"/><path d="M16.75 3.77A9.5 3.8 120 1 0 7.25 20.23A9.5 3.8 120 1 0 16.75 3.77"/>'
};

export const typescript: IconDef = {
    name: 'typescript',
    category,
    tags: ['ts', 'language', 'javascript'],
    body: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M6.5 11h5M9 11v6.5M14 17.3c.6.5 1.3.7 2 .7 1.3 0 2.2-.7 2.2-1.7 0-2.2-4-1.4-4-3.6 0-1 .9-1.7 2.2-1.7.7 0 1.4.2 2 .6"/>'
};

export const figma: IconDef = {
    name: 'figma',
    category,
    tags: ['design', 'prototype', 'ui'],
    body: '<path d="M12 2.5H8.75a3.25 3.25 0 0 0 0 6.5H12zM12 2.5h3.25a3.25 3.25 0 0 1 0 6.5H12zM12 9H8.75a3.25 3.25 0 0 0 0 6.5H12zM12 9v6.5M12 15.5H8.75a3.25 3.25 0 1 0 3.25 3.25z"/><circle cx="15.25" cy="12.25" r="3.25"/>'
};

// ---- products

export const apple: IconDef = {
    name: 'apple',
    category,
    tags: ['ios', 'macos', 'sign in', 'store'],
    body: '<path d="M16.2 12.6c0-2.3 1.9-3.4 2-3.4-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.6.9s-1.9-.8-3.1-.8c-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.7c1.3 0 2.1-1.2 2.9-2.3-.9-.5-2.3-1.6-2.3-3.8z"/><path d="M14.2 5.6c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1 0 2.2-.6 2.8-1.4z"/>'
};

export const google: IconDef = {
    name: 'google',
    category,
    tags: ['sign in', 'search', 'account'],
    body: '<path d="M21 12.2c0 5-3.6 8.6-9 8.6a9 9 0 1 1 0-18c2.4 0 4.5.9 6 2.4l-2.5 2.4A5.3 5.3 0 0 0 12 6.2a5.8 5.8 0 0 0 0 11.6c3 0 4.7-1.7 5.1-4.2H12v-3.2h9z"/>'
};

export const microsoft: IconDef = {
    name: 'microsoft',
    category,
    tags: ['windows', 'sign in', 'azure', 'office'],
    body: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>'
};

export const spotify: IconDef = {
    name: 'spotify',
    category,
    tags: ['music', 'streaming', 'audio'],
    body: '<circle cx="12" cy="12" r="9"/><path d="M7.3 9.4a12 12 0 0 1 9.4 1.2M8 12.6a9.5 9.5 0 0 1 7.5 1M8.7 15.6a7 7 0 0 1 5.8.8"/>'
};

export const dropbox: IconDef = {
    name: 'dropbox',
    category,
    tags: ['storage', 'files', 'cloud'],
    body: '<path d="M7 3l5 3.2L7 9.4 2 6.2zM17 3l5 3.2-5 3.2-5-3.2zM2 12.6l5-3.2 5 3.2-5 3.2zM22 12.6l-5-3.2-5 3.2 5 3.2z"/><path d="M7 17.4l5-3.2 5 3.2-5 3.4z"/>'
};

export const slack: IconDef = {
    name: 'slack',
    category,
    tags: ['chat', 'work', 'channels'],
    body: '<rect x="10" y="2.5" width="4" height="9" rx="2"/><rect x="10" y="12.5" width="4" height="9" rx="2"/><rect x="2.5" y="10" width="9" height="4" rx="2"/><rect x="12.5" y="10" width="9" height="4" rx="2"/>'
};

export const medium: IconDef = {
    name: 'medium',
    category,
    tags: ['blog', 'writing', 'publication'],
    body: '<ellipse cx="6.5" cy="12" rx="4" ry="6.5"/><ellipse cx="15" cy="12" rx="2" ry="6.5"/><ellipse cx="20.5" cy="12" rx="1" ry="6.5"/>'
};
