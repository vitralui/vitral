// The spinner as a ring: an accent arc that
// grows, shrinks and turns — or, given a value, fills clockwise.
export default {
    root: {
        size: '2rem',
        color: '{primary.color}',
        animationDuration: '2s'
    },
    colorScheme: {
        light: { root: { trackColor: '{surface.300}' } },
        dark: { root: { trackColor: '{surface.700}' } }
    }
};
