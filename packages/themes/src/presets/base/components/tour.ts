// A guided tour: the page dimmed but for the one thing being explained, and a
// popover beside it that reads like any other Vitral panel.
export default {
    root: {
        transitionDuration: '{transitionPresetDuration}',
        colorScheme: {
            light: { overlayColor: '#000000', overlayOpacity: '0.55' },
            dark: { overlayColor: '#000000', overlayOpacity: '0.7' }
        }
    },
    popover: {
        background: '{overlay.popover.background}',
        color: '{overlay.popover.color}',
        borderColor: '{overlay.popover.borderColor}',
        borderRadius: '{overlay.popover.borderRadius}',
        shadow: '{overlay.modal.shadow}',
        padding: '1rem',
        gap: '0.5rem',
        width: '20rem'
    },
    arrow: {
        size: '0.75rem'
    },
    image: {
        borderRadius: '{borderRadius.md}'
    },
    title: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '{text.hoverColor}'
    },
    description: {
        color: '{text.color}',
        lineHeight: '1.55'
    },
    footer: {
        gap: '0.5rem',
        marginTop: '0.5rem'
    },
    progress: {
        fontSize: '0.75rem',
        color: '{text.mutedColor}'
    },
    dot: {
        size: '0.375rem',
        gap: '0.3125rem',
        background: 'color-mix(in srgb, {text.color} 22%, transparent)',
        activeBackground: '{primary.color}'
    },
    bar: {
        height: '0.25rem',
        borderRadius: '{borderRadius.pill}',
        background: 'color-mix(in srgb, {text.color} 14%, transparent)',
        fillBackground: '{primary.color}'
    },
    button: {
        padding: '0.375rem 0.75rem',
        borderRadius: '{formField.borderRadius}',
        fontSize: '0.8125rem',
        fontWeight: '500',
        borderWidth: '1px'
    },
    nextButton: {
        background: '{primary.color}',
        hoverBackground: '{primary.hoverColor}',
        color: '{primary.contrastColor}',
        borderColor: '{primary.color}'
    },
    previousButton: {
        background: 'transparent',
        hoverBackground: '{content.hoverBackground}',
        color: '{text.color}',
        borderColor: '{content.borderColor}'
    },
    closeButton: {
        size: '1.75rem',
        borderRadius: '{iconButton.borderRadius}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    }
};
