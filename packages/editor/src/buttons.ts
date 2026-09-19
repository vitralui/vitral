import type { Locale } from '@vitral/core';
import {
    bold,
    clearFormatting,
    code,
    codeBlock,
    heading1,
    heading2,
    heading3,
    horizontalRule,
    indent,
    italic,
    link,
    list,
    listChecks,
    listOrdered,
    outdent,
    pilcrow,
    quote,
    redo,
    strikethrough,
    underline,
    undo,
    type IconDef
} from '@vitral/icons';
import type { EditorButtonCommand, EditorToolbarItem } from './types';

/**
 * What every toolbar button is — icon, name, command, pressed state — as plain
 * data, so the Vue toolbar, the framework-free one and anything else draw the
 * same buttons from the same list.
 */

export interface EditorButtonSpec {
    icon: IconDef;
    label: (text: Locale['editor']) => string;
    /** The command the button runs, with its arguments; `link` opens the link editor. */
    command: readonly [string, ...unknown[]];
    /** What the button's pressed state reflects. */
    active?: readonly [string, Record<string, unknown>?];
}

/** What each plain toolbar button is: icon, name, command and pressed state. */
export const editorButtons: Record<EditorButtonCommand, EditorButtonSpec> = {
    paragraph: { icon: pilcrow, label: (t) => t.paragraph, command: ['setParagraph'], active: ['paragraph'] },
    heading1: { icon: heading1, label: (t) => t.heading1, command: ['toggleHeading', 1], active: ['heading', { level: 1 }] },
    heading2: { icon: heading2, label: (t) => t.heading2, command: ['toggleHeading', 2], active: ['heading', { level: 2 }] },
    heading3: { icon: heading3, label: (t) => t.heading3, command: ['toggleHeading', 3], active: ['heading', { level: 3 }] },
    bold: { icon: bold, label: (t) => t.bold, command: ['toggleBold'], active: ['bold'] },
    italic: { icon: italic, label: (t) => t.italic, command: ['toggleItalic'], active: ['italic'] },
    underline: { icon: underline, label: (t) => t.underline, command: ['toggleUnderline'], active: ['underline'] },
    strike: { icon: strikethrough, label: (t) => t.strike, command: ['toggleStrike'], active: ['strike'] },
    code: { icon: code, label: (t) => t.code, command: ['toggleCode'], active: ['code'] },
    bulletList: { icon: list, label: (t) => t.bulletList, command: ['toggleBulletList'], active: ['bulletList'] },
    orderedList: { icon: listOrdered, label: (t) => t.orderedList, command: ['toggleOrderedList'], active: ['orderedList'] },
    taskList: { icon: listChecks, label: (t) => t.taskList, command: ['toggleTaskList'], active: ['taskList'] },
    indent: { icon: indent, label: (t) => t.indent, command: ['sinkListItem'] },
    outdent: { icon: outdent, label: (t) => t.outdent, command: ['liftListItem'] },
    blockquote: { icon: quote, label: (t) => t.blockquote, command: ['toggleBlockquote'], active: ['blockquote'] },
    codeBlock: { icon: codeBlock, label: (t) => t.codeBlock, command: ['toggleCodeBlock'], active: ['codeBlock'] },
    horizontalRule: { icon: horizontalRule, label: (t) => t.horizontalRule, command: ['insertHorizontalRule'] },
    link: { icon: link, label: (t) => t.link, command: ['link'], active: ['link'] },
    undo: { icon: undo, label: (t) => t.undo, command: ['undo'] },
    redo: { icon: redo, label: (t) => t.redo, command: ['redo'] },
    clear: { icon: clearFormatting, label: (t) => t.clearFormatting, command: ['clearFormatting'] }
};

/** Where a button's shortcut is looked up, when it is not its own command's. */
export const shortcutCommands: Partial<Record<EditorButtonCommand, readonly [string, ...unknown[]]>> = {
    indent: ['indent'],
    outdent: ['outdent']
};

/** The toolbar `<Editor>` shows unless told otherwise. */
export const defaultToolbar: EditorToolbarItem[][] = [
    ['blockType'],
    ['bold', 'italic', 'underline', 'strike', 'code'],
    ['color', 'highlight'],
    ['bulletList', 'orderedList', 'taskList'],
    ['blockquote', 'codeBlock', 'link', 'image', 'table', 'horizontalRule'],
    ['undo', 'redo', 'clear']
];

/** The floating toolbar's buttons. */
export const defaultBubbleMenu: EditorToolbarItem[] = ['bold', 'italic', 'underline', 'strike', 'code', 'link', 'color'];
