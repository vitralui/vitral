// A drawer is a modal panel against one edge of the viewport; it shares the
// `overlay.modal` surface with the dialog.
export default {
    root: {
        background: '{overlay.modal.background}',
        borderColor: '{overlay.modal.borderColor}',
        color: '{overlay.modal.color}',
        shadow: '{overlay.modal.shadow}',
        padding: '{overlay.modal.padding}',
        gap: '0.75rem',
        /** Width of a left or right drawer. */
        width: '20rem',
        /** Height of a top or bottom drawer. */
        height: '16rem',
        transitionDuration: '0.25s'
    },
    title: {
        fontSize: '1.125rem',
        fontWeight: '600',
        lineHeight: '1.4'
    },
    footer: {
        borderColor: '{overlay.modal.borderColor}',
        gap: '0.5rem'
    },
    headerButton: {
        size: '2rem',
        borderRadius: '{iconButton.borderRadius}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    }
};
