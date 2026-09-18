// A tooltip is a small popover — the flyout's surface, a lighter
// shadow, caption-sized text — rather than as a dark chip.
export default {
    root: {
        background: '{overlay.popover.background}',
        borderColor: '{overlay.popover.borderColor}',
        color: '{overlay.popover.color}',
        borderRadius: '{borderRadius.md}',
        shadow: '0 4px 8px rgba(0, 0, 0, 0.14)',
        padding: '0.3125rem 0.5rem 0.4375rem',
        maxWidth: '20rem',
        fontSize: '0.75rem',
        lineHeight: '1.35',
        transitionDuration: '0.15s'
    }
};
