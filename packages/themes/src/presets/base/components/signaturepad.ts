// A pad to sign on: the field's frame and ground, a line to sign along, and
// the ink in the text colour.
export default {
    root: {
        height: '10rem',
        background: '{formField.background}',
        borderColor: '{formField.borderColor}',
        hoverBorderColor: '{formField.hoverBorderColor}',
        borderWidth: '{formField.borderWidth}',
        borderRadius: '{formField.borderRadius}'
    },
    pen: {
        color: '{text.color}',
        width: '2.5'
    },
    line: {
        color: '{content.borderColor}',
        inset: '1.5rem',
        bottom: '2rem'
    },
    placeholder: {
        color: '{text.mutedColor}',
        fontSize: '0.8125rem'
    },
    controls: {
        gap: '0.25rem',
        inset: '0.375rem'
    }
};
