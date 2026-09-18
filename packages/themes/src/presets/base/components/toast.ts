// A toast is a notification card on the popover surface; its severity shows in
// the icon, taken from the semantic severity colours.
export default {
    root: {
        width: '24rem',
        /** Distance from the edge of the viewport. */
        offset: '1rem',
        gap: '0.75rem',
        transitionDuration: '0.2s'
    },
    message: {
        background: '{overlay.popover.background}',
        borderColor: '{overlay.popover.borderColor}',
        color: '{overlay.popover.color}',
        borderRadius: '{overlay.popover.borderRadius}',
        shadow: '{overlay.popover.shadow}',
        padding: '0.75rem 0.75rem 0.75rem 1rem',
        gap: '0.75rem'
    },
    icon: {
        size: '1.25rem'
    },
    summary: {
        fontWeight: '600'
    },
    detail: {
        color: '{text.mutedColor}'
    },
    closeButton: {
        size: '1.75rem',
        borderRadius: '{iconButton.borderRadius}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    }
};
