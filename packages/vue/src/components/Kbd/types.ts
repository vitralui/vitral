import type { BaseProps, Size } from '../../base/types';

export interface KbdProps extends BaseProps {
    /**
     * The shortcut: `'mod+k'`, `'shift+enter'`, or the keys as an array.
     * `mod` is ⌘ on a Mac and Ctrl elsewhere, and the modifiers are drawn as
     * each platform draws them. The default slot replaces it for a single key.
     */
    keys?: string | string[];
    /** Drawn between the keys. Defaults to none on a Mac, where ⌘⇧P is read as one, and `'+'` elsewhere. */
    separator?: string;
    /** Which platform's names to use; `'auto'` (the default) asks the browser once mounted. */
    platform?: 'auto' | 'mac' | 'other';
    size?: Size;
}

export interface KbdSlots {
    /** One key's text, in place of `keys`. */
    default?: () => unknown;
}
