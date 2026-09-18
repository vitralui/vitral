import { sameSelection, type EditorSelection, type EditorState } from './state';
import type { EditorNode } from './model';

/** How an edit joins the undo stack: consecutive `typing` (or `delete`) at the caret groups into one step. */
export type EditorEditKind = 'typing' | 'delete' | 'other';

interface HistoryEntry {
    doc: EditorNode;
    selection: EditorSelection;
    kind: EditorEditKind;
    time: number;
    /** Where the selection was after the edit, to tell whether the next one continues it. */
    after: EditorSelection;
}

export interface EditorHistory {
    readonly done: readonly HistoryEntry[];
    readonly undone: readonly HistoryEntry[];
}

export interface HistoryOptions {
    /** Milliseconds within which consecutive typing is one undo step. Defaults to 500. */
    groupDelay?: number;
    /** Undo steps kept. Defaults to 200. */
    depth?: number;
}

export function createHistory(): EditorHistory {
    return { done: [], undone: [] };
}

/**
 * The history after an edit from `before` to `after`. Typing that continues
 * where the previous typing left off, soon enough, extends that step instead
 * of starting a new one; anything else is a step of its own, and forgets
 * what was undone.
 */
export function recordHistory(history: EditorHistory, before: EditorState, after: EditorState, kind: EditorEditKind, time: number, options: HistoryOptions = {}): EditorHistory {
    if (before.doc === after.doc) return history;
    const { groupDelay = 500, depth = 200 } = options;
    const previous = history.done[history.done.length - 1];
    if (previous && kind !== 'other' && previous.kind === kind && time - previous.time <= groupDelay && sameSelection(previous.after, before.selection)) {
        const done = history.done.slice(0, -1);
        done.push({ ...previous, time, after: after.selection });
        return { done, undone: [] };
    }
    const done = [...history.done, { doc: before.doc, selection: before.selection, kind, time, after: after.selection }];
    if (done.length > depth) done.splice(0, done.length - depth);
    return { done, undone: [] };
}

/** Steps back: the restored state and the history with the current state kept for redo; null with nothing to undo. */
export function undoHistory(history: EditorHistory, current: EditorState): { history: EditorHistory; state: EditorState } | null {
    const entry = history.done[history.done.length - 1];
    if (!entry) return null;
    return {
        history: { done: history.done.slice(0, -1), undone: [...history.undone, { doc: current.doc, selection: current.selection, kind: 'other', time: 0, after: current.selection }] },
        state: { doc: entry.doc, selection: entry.selection, storedMarks: null }
    };
}

export function redoHistory(history: EditorHistory, current: EditorState): { history: EditorHistory; state: EditorState } | null {
    const entry = history.undone[history.undone.length - 1];
    if (!entry) return null;
    return {
        history: { done: [...history.done, { doc: current.doc, selection: current.selection, kind: 'other', time: 0, after: entry.selection }], undone: history.undone.slice(0, -1) },
        state: { doc: entry.doc, selection: entry.selection, storedMarks: null }
    };
}

/** Breaks the current group, so the next edit starts a step of its own. */
export function closeHistoryGroup(history: EditorHistory): EditorHistory {
    const previous = history.done[history.done.length - 1];
    if (!previous || previous.kind === 'other') return history;
    return { done: [...history.done.slice(0, -1), { ...previous, kind: 'other' }], undone: history.undone };
}
