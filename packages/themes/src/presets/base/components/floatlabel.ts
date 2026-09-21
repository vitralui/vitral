// A label that starts inside the field and lifts out of it once the field has a
// value or the focus. `in` keeps it inside, `on` parks it on the border.
export default {
    root: {
        color: '{formField.placeholderColor}',
        focusColor: '{primary.color}',
        invalidColor: '{formField.invalidPlaceholderColor}',
        activeFontSize: '0.75rem',
        transitionDuration: '{transitionDuration}',
        positionX: '{formField.paddingX}',
        activeBackground: '{formField.background}',
        // The `in` variant keeps the lifted label inside the field, so the
        // field has to make room for it above what is typed.
        inTop: '0.5rem',
        inPaddingTop: '1.25rem',
        inPaddingBottom: '0.375rem'
    }
};
