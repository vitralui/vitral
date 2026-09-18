import { useVitral } from '../config/config';
import type { ConfirmOptions } from '../config/services';

/** Opens the `<ConfirmDialog>` mounted with the same `group`, from anywhere below the plugin. */
export function useConfirm() {
    const { confirm } = useVitral();
    return {
        require(options: ConfirmOptions) {
            confirm.emit('require', options);
        },
        close() {
            confirm.emit('close', undefined);
        }
    };
}
