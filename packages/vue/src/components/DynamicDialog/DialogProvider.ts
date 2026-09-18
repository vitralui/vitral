import { defineComponent, provide, type PropType } from 'vue';
import { DialogRefKey } from '../../composables/useDialog';
import type { DynamicDialogInstance } from '../../config/services';

/** Hands one dialog's instance to the content rendered inside it. */
export default defineComponent({
    name: 'VtDialogProvider',
    props: { instance: { type: Object as PropType<DynamicDialogInstance>, required: true } },
    setup(props, { slots }) {
        provide(DialogRefKey, props.instance);
        provide('dialogRef', props.instance);
        return () => slots.default?.();
    }
});
