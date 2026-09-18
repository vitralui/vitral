import { optionClasses, type OptionState } from '../base';
import { defineStyle } from '../defineStyle';
import css from './command.css?raw';

export const commandStyle = defineStyle({
    name: 'command',
    css,
    classes: {
        root: 'vt-command',
        inputWrapper: 'vt-command-input-wrapper',
        input: 'vt-command-input',
        list: 'vt-command-list',
        group: 'vt-command-group',
        groupHeading: 'vt-command-group-heading',
        groupItems: 'vt-command-group-items',
        item: (s: OptionState) => [optionClasses(s), 'vt-command-item'],
        shortcut: 'vt-command-shortcut',
        empty: 'vt-command-empty',
        separator: 'vt-command-separator',
        status: 'vt-sr-only',
        dialog: 'vt-command-dialog'
    }
});
