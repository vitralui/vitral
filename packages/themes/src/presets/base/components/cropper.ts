// A crop rectangle over an image: the picture outside it is dimmed, the
// rectangle is outlined, and its corners and edges carry handles. The veil is
// the same in both schemes — it darkens the photograph, not the page.
export default {
    root: {
        gap: '0.75rem',
        borderRadius: '{content.borderRadius}'
    },
    stage: {
        background: '{surface.900}'
    },
    area: {
        veil: 'rgba(0, 0, 0, 0.5)',
        outlineColor: '{surface.0}',
        gridColor: 'rgba(255, 255, 255, 0.45)'
    },
    handle: {
        size: '0.625rem',
        background: '{surface.0}',
        borderColor: 'rgba(0, 0, 0, 0.35)'
    }
};
