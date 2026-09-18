// A swatch that opens a panel: a saturation/brightness area, a hue strip and
// the hex value. The handles are drawn in white with a dark ring, so they show
// on any colour.
export default {
    root: {
        swatchSize: '{control.minHeight}',
        swatchBorderRadius: '{formField.borderRadius}',
        swatchBorderColor: '{formField.borderColor}',
        transitionDuration: '{transitionDuration}'
    },
    panel: {
        width: '14rem',
        padding: '0.75rem',
        gap: '0.75rem',
        background: '{overlay.popover.background}',
        borderColor: '{overlay.popover.borderColor}',
        borderRadius: '{overlay.popover.borderRadius}',
        shadow: '{overlay.popover.shadow}'
    },
    area: {
        height: '9rem',
        borderRadius: '{borderRadius.sm}'
    },
    hue: {
        height: '0.75rem',
        borderRadius: '{borderRadius.pill}'
    },
    chequer: {
        color: '{surface.300}'
    },
    handle: {
        size: '1rem',
        borderColor: '{surface.0}',
        ringColor: 'rgba(0, 0, 0, 0.45)'
    }
};
