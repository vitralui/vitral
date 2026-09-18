// A text box with a suggestion list: the field chrome, the shared option list
// in an overlay, and — when several values are chosen — chips inside the field.
export default {
    root: {
        gap: '0.5rem',
        dropdownWidth: '2.25rem',
        dropdownColor: '{formField.iconColor}',
        dropdownHoverColor: '{text.color}',
        dropdownBorderColor: '{formField.borderColor}',
        overlayMaxHeight: '15rem'
    },
    chip: {
        gap: '0.25rem',
        paddingY: '0.25rem'
    }
};
