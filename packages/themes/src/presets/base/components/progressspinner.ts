// The spinner as a ring: an accent arc that
// grows, shrinks and turns, or fills clockwise when given a value.
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
