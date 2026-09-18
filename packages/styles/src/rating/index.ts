import { defineStyle } from '../defineStyle';
import css from './rating.css?raw';

export interface RatingState {
    readonly?: boolean;
    disabled?: boolean;
    invalid?: boolean;
}

export interface RatingOptionState {
    active?: boolean;
    hover?: boolean;
    focused?: boolean;
}

export const ratingStyle = defineStyle({
    name: 'rating',
    css,
    classes: {
        root: (s: RatingState) => [
            'vt-rating',
            { 'vt-rating-readonly': s.readonly, 'vt-rating-disabled': s.disabled, 'vt-rating-invalid': s.invalid, 'vt-rating-interactive': !s.readonly && !s.disabled }
        ],
        option: (s: RatingOptionState) => ['vt-rating-option', { 'vt-rating-option-active': s.active, 'vt-rating-option-hover': s.hover }],
        onIcon: 'vt-rating-icon vt-rating-on-icon',
        offIcon: 'vt-rating-icon vt-rating-off-icon'
    }
});
