// A dialog is a modal surface: the `overlay.modal` semantic tokens paint it, so
// a preset restyles every modal at once. The footer is a band on the app
// background, the way a dialog's button row is drawn.
export default {
    root: {
        background: '{overlay.modal.background}',
        borderColor: '{overlay.modal.borderColor}',
        color: '{overlay.modal.color}',
        borderRadius: '{overlay.modal.borderRadius}',
        shadow: '{overlay.modal.shadow}',
        padding: '{overlay.modal.padding}',
        gap: '0.75rem',
        minWidth: '20rem',
        /** Space kept between the dialog and the edge of the viewport. */
        margin: '1rem',
        transitionDuration: '0.2s'
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: '600',
        lineHeight: '1.4'
    },
    footer: {
        background: '{app.background}',
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
