// An icon laid over a field's padding. The field keeps its own chrome and only
// makes room for the icon on the side it sits.
export default {
    icon: {
        color: '{formField.iconColor}',
        size: '{icon.size}',
        /** How far the icon sits from the field's edge. */
        inset: '{formField.paddingX}',
        /** The space between the icon and the text. */
        gap: '0.5rem'
    }
};
