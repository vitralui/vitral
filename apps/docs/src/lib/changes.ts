import { components, version } from 'virtual:vitral-changes';
import type { Change, ChangeKind } from '../../../../scripts/changes';

/**
 * What is new and what has changed lately, read from the release tags when the
 * site is built (see `scripts/changes.ts`), and the version it is built from.
 * Nothing here is written by hand: a prop added in a release is marked new
 * for the next few, and then it is not.
 */
export { version };
export type { Change };

/** A component that the last few releases added or changed, by its file name (`Button`). */
export function componentChange(file: string): Change | undefined {
    return components[file];
}

/** A prop, event or slot of a component that the last few releases added or changed. */
export function memberChange(file: string, kind: ChangeKind, name: string): Change | undefined {
    return components[file]?.[kind]?.[name];
}
