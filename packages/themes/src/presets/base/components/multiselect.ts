// Select's field and list, with a checkbox beside each option and a header
// that selects them all. The boxes take the checkbox tokens, so the two agree.
export default {
    root: {
        dropdownWidth: '1.25rem',
        dropdownColor: '{formField.iconColor}',
        clearIconColor: '{formField.iconColor}',
        overlayMaxHeight: '15rem',
        chipGap: '0.25rem'
    },
    header: {
        gap: '0.5rem',
        borderColor: '{content.borderColor}'
    },
    option: {
        gap: '0.5rem'
    }
};
