// The switch: a 40×20 pill. Off, it is outlined in a strong stroke
// with a dark knob; on, it fills with the accent and the knob turns light and
// slides across. The knob grows under the pointer and stretches while pressed.
export default {
    root: {
        width: '2.5rem',
        height: '1.25rem',
        borderRadius: '{borderRadius.pill}',
        borderWidth: '1px',
        gap: '0.75rem',
        headerGap: '0.375rem',
        background: '{formField.filledBackground}',
        hoverBackground: '{formField.filledHoverBackground}',
        borderColor: '{text.mutedColor}',
        hoverBorderColor: '{text.hoverMutedColor}',
        checkedBackground: '{primary.color}',
        checkedHoverBackground: '{primary.hoverColor}',
        checkedBorderColor: '{primary.color}',
        invalidBorderColor: '{formField.invalidBorderColor}',
        knobColor: '{text.mutedColor}',
        knobHoverColor: '{text.hoverMutedColor}',
        checkedKnobColor: '{primary.contrastColor}',
        knobSize: '0.75rem',
        knobHoverSize: '0.875rem',
        knobPressedWidth: '1.0625rem',
        /** Space between the knob and the end of the track. */
        knobInset: '0.1875rem',
        labelColor: '{text.color}',
        transitionDuration: '0.167s'
    }
};
