// A QR Code: dark squares on a light ground in every scheme, because a phone's
// camera reads a light-on-dark code badly, and a quiet margin around it.
export default {
    root: {
        color: '#000000',
        background: '#ffffff',
        borderRadius: '{borderRadius.sm}',
        size: '10rem'
    },
    image: {
        background: '#ffffff',
        borderRadius: '{borderRadius.sm}'
    }
};
