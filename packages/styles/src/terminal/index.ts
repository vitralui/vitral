import { defineStyle } from '../defineStyle';
import css from './terminal.css?raw';

export const terminalStyle = defineStyle({
    name: 'terminal',
    css,
    classes: {
        root: 'vt-terminal',
        welcome: 'vt-terminal-welcome',
        log: 'vt-terminal-log',
        entry: 'vt-terminal-entry',
        response: 'vt-terminal-response',
        prompt: 'vt-terminal-prompt',
        line: 'vt-terminal-line',
        input: 'vt-terminal-input'
    }
});
