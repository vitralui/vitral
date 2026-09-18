import { defineStyle } from '../defineStyle';
import css from './cropper.css?raw';

export interface CropperState {
    shape?: 'rect' | 'circle';
    dragging?: boolean;
    disabled?: boolean;
}

export const cropperStyle = defineStyle({
    name: 'cropper',
    css,
    classes: {
        root: (s: CropperState) => ['vt-cropper', { 'vt-cropper-circle': s.shape === 'circle', 'vt-cropper-dragging': s.dragging, 'vt-cropper-disabled': s.disabled }],
        stage: 'vt-cropper-stage',
        image: 'vt-cropper-image',
        area: 'vt-cropper-area',
        grid: 'vt-cropper-grid',
        handle: (s: { handle?: string }) => ['vt-cropper-handle', `vt-cropper-handle-${s.handle}`],
        toolbar: 'vt-cropper-toolbar',
        zoom: 'vt-cropper-zoom',
        preview: 'vt-cropper-preview'
    }
});
