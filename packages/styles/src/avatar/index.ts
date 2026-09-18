import { defineStyle } from '../defineStyle';
import css from './avatar.css?raw';

export interface AvatarState {
    size?: string;
    shape?: string;
}

export const avatarStyle = defineStyle({
    name: 'avatar',
    css,
    classes: {
        root: (s: AvatarState) => [
            'vt-avatar',
            { 'vt-avatar-lg': s.size === 'large', 'vt-avatar-xl': s.size === 'xlarge', 'vt-avatar-circle': s.shape === 'circle' }
        ],
        image: 'vt-avatar-image',
        icon: 'vt-avatar-icon',
        label: 'vt-avatar-label'
    }
});
