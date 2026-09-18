import type { BaseProps } from '../../base/types';

export interface TerminalProps extends BaseProps {
    /** Shown above the first command. */
    welcomeMessage?: string;
    /** What each line starts with. Defaults to `'$'`. */
    prompt?: string;
    /** Names the command line. Defaults to the locale's "Command". */
    inputLabel?: string;
}

export interface TerminalCommandEvent {
    command: string;
    /** Prints the answer under the command. Call it as often as needed, now or later. */
    respond: (text: string) => void;
}

export type TerminalEmits = {
    command: [event: TerminalCommandEvent];
};

export interface TerminalSlots {
    /** Replaces the welcome message. */
    welcome?: () => unknown;
}
