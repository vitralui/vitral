// A console: monospaced text on the content surface, the prompt in the accent.
export default {
    root: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        color: '{text.color}',
        padding: '0.75rem 1rem',
        height: '18rem',
        fontFamily: '{fontFamilyMono}',
        fontSize: '0.8125rem',
        gap: '0.25rem'
    },
    prompt: {
        color: '{primary.color}',
        gap: '0.5rem'
    },
    response: {
        color: '{text.mutedColor}'
    }
};
