export default {
    root: {
        background: '{content.background}',
        color: '{content.color}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        transitionDuration: '{transitionDuration}'
    },
    gutter: {
        size: '4px',
        background: '{content.borderColor}',
        hoverBackground: '{surface.300}',
        activeBackground: '{primary.color}'
    },
    handle: {
        length: '1.5rem',
        thickness: '2px',
        background: '{surface.400}',
        activeBackground: '{primary.contrastColor}',
        borderRadius: '{borderRadius.pill}'
    },
    colorScheme: {
        dark: {
            gutter: { hoverBackground: '{surface.600}' },
            handle: { background: '{surface.500}' }
        }
    }
};
