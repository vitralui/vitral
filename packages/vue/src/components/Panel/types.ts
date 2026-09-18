import type { BaseProps, IconProp } from '../../base/types';

export interface PanelProps extends BaseProps {
    /** The header's text. */
    header?: string;
    /** Makes the header a button that shows and hides the content. */
    toggleable?: boolean;
    /** Replaces the chevron. The chevron turns over when open; a custom icon stays as it is. */
    toggleIcon?: IconProp;
}

export interface PanelToggleEvent {
    originalEvent: Event;
    /** The new `collapsed` value. */
    value: boolean;
}

export type PanelEmits = {
    toggle: [event: PanelToggleEvent];
};

export interface PanelSlots {
    /** Replaces the `header` text. Inside the toggle button when toggleable, so it must not hold controls of its own. */
    header?: () => unknown;
    /** Actions at the end of the header; kept outside the toggle button. */
    icons?: () => unknown;
    toggleicon?: (props: { collapsed: boolean }) => unknown;
    default?: () => unknown;
    footer?: () => unknown;
}
