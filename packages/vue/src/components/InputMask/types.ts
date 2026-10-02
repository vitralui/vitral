import type { MaskOptions, MaskPattern, MaskProp } from '@vitral/core';
import type { BaseProps, InputVariant, MaskFieldProps, Size } from '../../base/types';

export type { MaskOptions, MaskPattern, MaskProp };

export interface InputMaskProps extends BaseProps, MaskFieldProps {
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
}

export type InputMaskEmits = {
    /** Every required slot is filled. */
    complete: [event: { originalEvent: Event; value: string }];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};
