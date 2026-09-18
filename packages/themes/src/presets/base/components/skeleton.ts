// The shape of what is loading. The sweep is a gradient moved across the box;
// it stops under `prefers-reduced-motion`, leaving the plain fill.
export default {
    root: {
        borderRadius: '{borderRadius.md}',
        animationDuration: '1.4s',
        colorScheme: {
            light: { background: '{surface.200}', highlight: 'rgba(255, 255, 255, 0.7)' },
            dark: { background: '{surface.800}', highlight: 'rgba(255, 255, 255, 0.08)' }
        }
    }
};
