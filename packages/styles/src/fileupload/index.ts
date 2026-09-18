import { defineStyle } from '../defineStyle';
import css from './fileupload.css?raw';

export const fileuploadStyle = defineStyle({
    name: 'fileupload',
    css,
    classes: {
        root: (s: { basic?: boolean; dragging?: boolean }) => ['vt-fileupload', { 'vt-fileupload-basic': s.basic, 'vt-fileupload-dragging': s.dragging }],
        header: 'vt-fileupload-header',
        choose: (s: { disabled?: boolean }) => ['vt-button vt-fileupload-choose', { 'vt-fileupload-choose-disabled vt-button-disabled': s.disabled }],
        chooseIcon: 'vt-button-icon',
        chooseLabel: 'vt-button-label',
        input: 'vt-fileupload-input',
        content: 'vt-fileupload-content',
        messages: 'vt-fileupload-messages',
        progress: 'vt-fileupload-progress',
        fileProgress: 'vt-fileupload-file-progress',
        removeButton: 'vt-fileupload-remove vt-icon-button',
        files: 'vt-fileupload-files',
        file: 'vt-fileupload-file',
        thumbnail: 'vt-fileupload-thumbnail',
        fileInfo: 'vt-fileupload-file-info',
        fileName: 'vt-fileupload-file-name',
        fileSize: 'vt-fileupload-file-size',
        empty: 'vt-fileupload-empty',
        filename: 'vt-fileupload-filename'
    }
});
