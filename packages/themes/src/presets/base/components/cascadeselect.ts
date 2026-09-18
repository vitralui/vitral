// Select's field; the popup is a column of options, and each group opens its
// own column beside it, drawn with the overlay chrome.
export default {
    root: {
        dropdownWidth: '1.25rem',
        dropdownColor: '{formField.iconColor}',
        clearIconColor: '{formField.iconColor}'
    },
    list: {
        minWidth: '12rem',
        maxHeight: '15rem',
        /** How far a column overlaps the one it opens from. */
        offset: '0.25rem'
    },
    groupIcon: {
        size: '0.875rem',
        color: '{list.option.icon.color}'
    }
};
