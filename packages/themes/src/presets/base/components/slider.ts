// The slider: a thin track, the chosen
// part filled with the accent, and a round thumb holding an accent dot that
// grows under the pointer and shrinks while pressed.
export default {
    root: {
        trackSize: '4px',
        trackBorderRadius: '{borderRadius.pill}',
        thumbSize: '1.25rem',
        thumbBorderRadius: '50%',
        dotSize: '0.75rem',
        dotHoverSize: '0.875rem',
        dotActiveSize: '0.625rem',
        verticalLength: '10rem',
        transitionDuration: '{transitionDuration}'
    },
    colorScheme: {
        light: {
            root: {
                trackBackground: 'color-mix(in srgb, {text.color} 45%, transparent)',
                rangeBackground: '{primary.color}',
                thumbBackground: '{surface.0}',
                thumbShadow: '0 0 0 1px color-mix(in srgb, {text.color} 12%, transparent), 0 1px 2px rgba(0, 0, 0, 0.14)',
                dotColor: '{primary.color}'
            }
        },
        dark: {
            root: {
                trackBackground: 'color-mix(in srgb, {text.color} 54%, transparent)',
                rangeBackground: '{primary.color}',
                thumbBackground: '{surface.700}',
                thumbShadow: '0 0 0 1px color-mix(in srgb, {text.color} 10%, transparent), 0 1px 2px rgba(0, 0, 0, 0.3)',
                dotColor: '{primary.color}'
            }
        }
    }
};
