// The field chrome (border, background, focus) is shared by every text-like
// control and comes from the semantic `formField` tokens; these are only what
// is particular to a text box.
export default {
    root: {
        gap: '0.5rem',
        clearIconColor: '{formField.iconColor}',
        clearIconHoverColor: '{text.color}'
    }
};
