// The label a field is named by: the field chrome's type, a medium weight, and
// a mark for a required field in the danger colour.
export default {
    root: {
        color: '{text.color}',
        fontSize: '0.8125rem',
        fontWeight: '500',
        lineHeight: '1.25',
        gap: '0.25rem',
        disabledOpacity: '{disabledOpacity}'
    },
    required: {
        color: '{danger.color}'
    },
    sm: { fontSize: '0.75rem' },
    lg: { fontSize: '0.875rem' }
};
