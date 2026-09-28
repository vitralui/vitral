import { defineStyle } from '../defineStyle';
import css from './qrcode.css?raw';

export const qrcodeStyle = defineStyle({
    name: 'qrcode',
    css,
    classes: {
        root: 'vt-qrcode',
        svg: 'vt-qrcode-svg',
        modules: 'vt-qrcode-modules',
        image: 'vt-qrcode-image'
    }
});
