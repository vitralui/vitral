// A task board: columns on a tinted track, cards on the content surface. A
// column at its work-in-progress limit takes the warn colours, one past it the
// danger colours; the drop target is ringed in the accent.
export default {
    root: {
        gap: '0.75rem',
        padding: '0.25rem',
        transitionDuration: '{transitionDuration}'
    },
    column: {
        width: '16rem',
        collapsedWidth: '3rem',
        padding: '0.5rem',
        gap: '0.5rem',
        borderRadius: '{borderRadius.lg}',
        borderWidth: '1px',
        accentWidth: '3px',
        dropBorderColor: '{primary.color}',
        refusedBorderColor: '{danger.color}',
        draggingOpacity: '0.5'
    },
    header: {
        padding: '0.5rem 0.5rem 0.5rem 0.75rem',
        gap: '0.375rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '{text.color}'
    },
    count: {
        padding: '0 0.5rem',
        borderRadius: '{borderRadius.pill}',
        fontSize: '0.75rem',
        fontWeight: '600',
        minWidth: '1.5rem',
        background: '{content.background}',
        color: '{text.mutedColor}',
        atBackground: '{warn.subtleBackground}',
        atColor: '{warn.subtleColor}',
        overBackground: '{danger.subtleBackground}',
        overColor: '{danger.subtleColor}'
    },
    handle: {
        size: '1.75rem',
        borderRadius: '{borderRadius.sm}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    },
    list: {
        gap: '0.5rem',
        minHeight: '2.5rem'
    },
    card: {
        padding: '0.625rem 0.75rem',
        borderRadius: '{borderRadius.md}',
        borderWidth: '1px',
        borderColor: '{content.borderColor}',
        hoverBorderColor: '{formField.hoverBorderColor}',
        color: '{text.color}',
        fontSize: '0.875rem',
        shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        grabbedBorderColor: '{primary.color}',
        grabbedShadow: '0 0 0 2px color-mix(in srgb, {primary.color} 30%, transparent)',
        draggingOpacity: '0.35',
        disabledOpacity: '{disabledOpacity}',
        lockedIconColor: '{text.mutedColor}'
    },
    preview: {
        shadow: '0 12px 28px -6px rgba(0, 0, 0, 0.3)',
        rotate: '2deg',
        opacity: '0.95'
    },
    lane: {
        padding: '0.5rem 0.25rem 0.25rem',
        gap: '0.375rem',
        fontWeight: '600',
        fontSize: '0.8125rem',
        color: '{text.mutedColor}',
        borderColor: '{content.borderColor}'
    },
    empty: {
        padding: '0.75rem',
        color: '{text.mutedColor}',
        fontSize: '0.8125rem',
        borderRadius: '{borderRadius.md}',
        borderColor: '{content.borderColor}'
    },
    footer: {
        padding: '0.25rem 0.5rem 0.5rem'
    },
    colorScheme: {
        light: {
            column: { background: '{surface.100}', borderColor: 'transparent', dropBackground: '{primary.50}' },
            card: { background: '{surface.0}' },
            preview: { background: '{surface.0}' }
        },
        dark: {
            column: { background: '{surface.900}', borderColor: '{surface.800}', dropBackground: 'color-mix(in srgb, {primary.400} 10%, {surface.900})' },
            card: { background: '{surface.800}' },
            preview: { background: '{surface.800}' }
        }
    }
};
