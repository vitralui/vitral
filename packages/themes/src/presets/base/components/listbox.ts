// A listbox is a field that holds options: the field's box around the shared
// option list, so it sits beside a text box and a select without a seam.
export default {
    root: {
        background: '{formField.background}',
        disabledBackground: '{formField.disabledBackground}',
        color: '{formField.color}',
        disabledColor: '{formField.disabledColor}',
        borderColor: '{content.borderColor}',
        hoverBorderColor: '{formField.hoverBorderColor}',
        invalidBorderColor: '{formField.invalidBorderColor}',
        borderWidth: '{formField.borderWidth}',
        borderRadius: '{formField.borderRadius}',
        transitionDuration: '{formField.transitionDuration}',
        checkmarkColor: '{list.option.selectedColor}'
    },
    header: {
        padding: '{list.header.padding}'
    },
    filter: {
        margin: '0'
    }
};
