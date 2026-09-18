import type { BaseProps } from '../../base/types';

export interface InplaceProps extends BaseProps {
    /** Adds a button that goes back to the display. */
    closable?: boolean;
    disabled?: boolean;
}

export type InplaceEmits = {
    open: [event: Event];
    close: [event: Event];
};

export interface InplaceSlots {
    /** What shows until it is activated. */
    display?: () => unknown;
    /** What it becomes: the editor. */
    content?: (props: { closeCallback: (event?: Event) => void }) => unknown;
}
