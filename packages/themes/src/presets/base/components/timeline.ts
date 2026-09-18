// Events on an axis: a small ringed marker per event, joined by a hairline.
export default {
    root: {
        gap: '1rem'
    },
    event: {
        minHeight: '4rem',
        padding: '0 1rem'
    },
    marker: {
        size: '1rem',
        borderRadius: '50%',
        borderWidth: '2px',
        borderColor: '{primary.color}',
        background: '{content.background}'
    },
    connector: {
        color: '{content.borderColor}',
        size: '2px'
    }
};
