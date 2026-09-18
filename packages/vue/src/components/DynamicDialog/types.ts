import type { BaseProps } from '../../base/types';

export interface DynamicDialogProps extends BaseProps {
    /** Default props for every dialog it shows; each `open()` call's `props` override them. */
    defaults?: Record<string, unknown>;
}
