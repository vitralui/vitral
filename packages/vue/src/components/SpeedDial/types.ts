import type { BaseProps, IconProp, Severity } from '../../base/types';
import type { MenuItem } from '../Menu/types';

export type SpeedDialDirection = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

export interface SpeedDialProps extends BaseProps {
    /** The actions; each item's `label` names its button and shows as a tooltip. */
    model?: MenuItem[];
    /** Where the actions open. Defaults to `'up'`. */
    direction?: SpeedDialDirection;
    /** A line (the default), or around a circle, a half or a quarter of one. */
    type?: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle';
    /** The circle's radius in pixels. Defaults to 20 per action. */
    radius?: number;
    /** The button's icon while closed. Defaults to a plus. */
    showIcon?: IconProp;
    /** The button's icon while open. Without one, the show icon turns. */
    hideIcon?: IconProp;
    /** Turn the icon as it opens. Defaults to true. */
    rotateAnimation?: boolean;
    /** Dim the page behind the open actions. */
    mask?: boolean;
    /** Milliseconds between one action appearing and the next. Defaults to 30. */
    transitionDelay?: number;
    /** Close on a press outside. Defaults to true. */
    hideOnClickOutside?: boolean;
    /** Names the button. */
    ariaLabel?: string;
    severity?: Severity;
    disabled?: boolean;
    /** Where the action tooltips appear. Defaults to the side away from the direction. */
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

export type SpeedDialEmits = {
    show: [];
    hide: [];
    click: [event: MouseEvent];
};

export interface SpeedDialSlots {
    /** An action's content. */
    item?: (props: { item: MenuItem; index: number }) => unknown;
    /** The button's icon. */
    icon?: (props: { visible: boolean }) => unknown;
}
