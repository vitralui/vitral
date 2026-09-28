// The field chrome (border, background, focus) comes from the semantic
// `formField` tokens, as every text-like control's does; these are only what
// is particular to a multi-line box.
export default {
    root: {
        /** Which way the grip resizes the box: `both` (diagonally), `vertical`, `horizontal` or `none`. A fluid box keeps to `vertical`; an auto-resizing one shows no grip. */
        resize: 'both'
    },
    // The grip is the library's own, drawn in the corner, rather than the one
    // each browser draws its own way.
    resizer: {
        size: '0.75rem',
        inset: '0.1875rem',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}'
    }
};
