// The form parts: the rhythm between fields and inside one (label, control,
// hint, error), the hint in the muted text colour, the error in the danger
// colour, and the error summary as a tinted box with a danger accent — the
// shape the GOV.UK summary made familiar.
export default {
    root: {
        gap: '1.25rem'
    },
    field: {
        gap: '0.375rem'
    },
    description: {
        color: '{text.mutedColor}',
        fontSize: '0.8125rem',
        lineHeight: '1.4'
    },
    message: {
        color: '{danger.color}',
        fontSize: '0.8125rem',
        fontWeight: '500',
        lineHeight: '1.4',
        gap: '0.375rem',
        iconSize: '0.875rem'
    },
    summary: {
        background: '{danger.subtleBackground}',
        borderColor: '{danger.subtleBorderColor}',
        borderWidth: '1px',
        accentColor: '{danger.color}',
        accentWidth: '4px',
        borderRadius: '{content.borderRadius}',
        padding: '1rem 1.25rem',
        gap: '0.5rem',
        color: '{text.color}',
        title: {
            color: '{text.color}',
            fontSize: '1rem',
            fontWeight: '600'
        },
        link: {
            color: '{danger.subtleColor}',
            hoverColor: '{text.color}',
            fontWeight: '500'
        }
    },
    fieldarray: {
        gap: '0.75rem'
    }
};
