import { defineStyle } from '../defineStyle';
import css from './skeleton.css?raw';

export interface SkeletonState {
    shape?: string;
    animated?: boolean;
}

export const skeletonStyle = defineStyle({
    name: 'skeleton',
    css,
    classes: {
        root: (s: SkeletonState) => ['vt-skeleton', { 'vt-skeleton-circle': s.shape === 'circle', 'vt-skeleton-animated': s.animated }]
    }
});
