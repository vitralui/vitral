// The confirmation beside what it is about: the popover surface, a message
// with its icon, and a compact row of answers.
export default {
    root: {
        background: '{overlay.popover.background}',
        borderColor: '{overlay.popover.borderColor}',
        color: '{overlay.popover.color}',
        borderRadius: '{overlay.popover.borderRadius}',
        shadow: '{overlay.popover.shadow}',
        maxWidth: '22rem'
    },
    content: {
        padding: '{overlay.popover.padding}',
        gap: '0.75rem'
    },
    icon: {
        size: '1.5rem',
        color: '{text.mutedColor}'
    },
    footer: {
        gap: '0.5rem',
        padding: '0 {overlay.popover.padding} {overlay.popover.padding} {overlay.popover.padding}'
    }
};
