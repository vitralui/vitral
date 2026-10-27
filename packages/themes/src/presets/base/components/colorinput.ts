// A text box for a colour: the swatch at its start opens the colour picker's
// panel, the hex is typed in the box. The panel is the picker's, so it takes
// the picker's tokens; these are the box's own parts and the row of swatches.
export default {
    root: {
        gap: '0.5rem',
        swatchSize: '1.25rem',
        swatchSmSize: '1rem',
        swatchLgSize: '1.5rem',
        swatchBorderRadius: '{borderRadius.sm}',
        swatchBorderColor: '{formField.borderColor}'
    },
    chequer: {
        color: '{surface.300}'
    },
    swatches: {
        gap: '0.375rem'
    },
    option: {
        size: '1.25rem',
        borderRadius: '{borderRadius.sm}',
        selectedRingColor: '{primary.color}'
    }
};
