// A 3px bar in the accent colour running over a 1px line.
export default {
    root: {
        height: '0.1875rem',
        trackHeight: '1px',
        borderRadius: '{borderRadius.pill}',
        valueColor: '{primary.color}',
        gap: '0.75rem',
        animationDuration: '2s'
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '{text.mutedColor}'
    },
    colorScheme: {
        light: { root: { trackColor: '{surface.500}' } },
        dark: { root: { trackColor: '{surface.400}' } }
    }
};
