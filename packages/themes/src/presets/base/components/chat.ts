// A conversation. The reader's own turns take the primary colour the way a
// selected option does; the other side takes the content surface, so a thread
// reads as two voices without inventing a palette for it.
export default {
    root: {
        background: '{content.background}',
        color: '{text.color}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        mutedColor: '{text.mutedColor}',
        hoverBackground: '{content.hoverBackground}',
        metaFontSize: '0.75rem',
        codeFontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    },
    header: { padding: '0.75rem 1rem' },
    log: { padding: '1rem' },
    group: { gap: '1rem' },
    message: {
        gap: '0.25rem',
        maxWidth: '42rem'
    },
    bubble: {
        padding: '0.5rem 0.75rem',
        radius: '{borderRadius.lg}'
    },
    own: {
        background: '{primary.color}',
        color: '{primary.contrastColor}'
    },
    other: {
        background: '{content.hoverBackground}',
        color: '{text.color}'
    },
    error: {
        background: 'color-mix(in srgb, {red.500} 12%, transparent)',
        color: '{red.600}'
    },
    avatar: {
        size: '2rem',
        gap: '0.625rem',
        background: '{content.hoverBackground}',
        color: '{text.mutedColor}',
        fontSize: '0.6875rem'
    },
    tool: { background: '{content.hoverBackground}' },
    caption: { authorColor: '{primary.color}' },
    composer: { padding: '0.75rem' },
    input: {
        padding: '0.5rem 0.625rem',
        radius: '{borderRadius.md}',
        background: '{formField.background}',
        borderColor: '{formField.borderColor}'
    },
    action: { size: '2.25rem' },
    send: {
        background: '{primary.color}',
        color: '{primary.contrastColor}',
        hoverBackground: '{primary.hoverColor}'
    },
    jump: { offset: '5rem' },
    launcher: { size: '3.5rem' },
    panel: {
        width: '22rem',
        shadow: '{overlay.popover.shadow}'
    }
};
