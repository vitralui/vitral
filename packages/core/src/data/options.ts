import { getField } from '../utils/object';

/** How to read an option list: which fields hold the text, the value, the disabled flag and the groups. */
export interface OptionFields {
    /** Field (dotted path) holding an option's text. Without it, options are shown as they are. */
    optionLabel?: string;
    /** Field holding the value. Without it, the whole option is the value. */
    optionValue?: string;
    optionDisabled?: string;
    /** Turns the list into groups: this field is each group's label… */
    optionGroupLabel?: string;
    /** …and this one its options. Defaults to `items`. */
    optionGroupChildren?: string;
}

/** One visible option, with what a list needs to render and navigate it. */
export interface OptionItem {
    option: unknown;
    /** Position in reading order across every group — what arrow keys step through. */
    index: number;
    label: string;
    value: unknown;
    disabled: boolean;
}

export interface OptionGroup {
    /** Null for the single unlabelled group of an ungrouped list. */
    label: string | null;
    raw: unknown;
    items: OptionItem[];
}

export function optionLabel(option: unknown, fields: OptionFields): string {
    const value = fields.optionLabel ? getField(option, fields.optionLabel) : option;
    return value === null || value === undefined ? '' : String(value);
}

export function optionValue(option: unknown, fields: OptionFields): unknown {
    return fields.optionValue ? getField(option, fields.optionValue) : option;
}

export function optionDisabled(option: unknown, fields: OptionFields): boolean {
    return !!(fields.optionDisabled && getField(option, fields.optionDisabled));
}

export function optionChildren(group: unknown, fields: OptionFields): unknown[] {
    return (getField(group, fields.optionGroupChildren ?? 'items') as unknown[] | undefined) ?? [];
}

/** Every option, with groups opened up — what a value is looked up in. */
export function flattenOptions(options: readonly unknown[], fields: OptionFields): unknown[] {
    return fields.optionGroupLabel ? options.flatMap((group) => optionChildren(group, fields)) : [...options];
}

/**
 * The options that pass `keep`, grouped when groups are configured (empty
 * groups dropped) and indexed in reading order across the groups, so a list
 * that renders groups still navigates as one sequence.
 */
export function groupOptions(options: readonly unknown[], fields: OptionFields, keep: (option: unknown) => boolean = () => true): OptionGroup[] {
    let index = 0;
    const build = (list: readonly unknown[]): OptionItem[] =>
        list.filter(keep).map((option) => ({
            option,
            index: index++,
            label: optionLabel(option, fields),
            value: optionValue(option, fields),
            disabled: optionDisabled(option, fields)
        }));
    const groupLabel = fields.optionGroupLabel;
    if (groupLabel) {
        return options
            .map((raw) => ({ label: String(getField(raw, groupLabel) ?? ''), raw, items: build(optionChildren(raw, fields)) }))
            .filter((group) => group.items.length > 0);
    }
    return [{ label: null, raw: null, items: build(options) }];
}
