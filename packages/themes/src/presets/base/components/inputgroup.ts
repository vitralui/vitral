// Fields and addons welded into one control: inner corners squared, one border
// between neighbours, and the focused member raised above its siblings.
export default {
    root: { borderRadius: '{formField.borderRadius}' },
    addon: {
        background: '{formField.filledBackground}',
        borderColor: '{formField.borderColor}',
        color: '{formField.iconColor}',
        paddingX: '0.75rem',
        minWidth: '2.5rem'
    }
};
