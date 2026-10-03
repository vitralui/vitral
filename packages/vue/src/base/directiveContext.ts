import type { ComponentPublicInstance, DirectiveBinding, VNode } from 'vue';
import type { VitralContext } from '../config/config';

/**
 * The plugin's context, for a directive. `binding.instance` is the component
 * whose template holds the directive, but a `<script setup>` component hands
 * out a closed proxy that has none of the app's global properties; the vnode
 * still knows the component that drew it, and its app.
 */
export function directiveContext(binding: DirectiveBinding, vnode?: VNode): VitralContext | undefined {
    const open = (binding.instance as (ComponentPublicInstance & { $vitral?: VitralContext }) | null)?.$vitral;
    if (open) return open;
    const owner = (vnode as (VNode & { ctx?: { appContext?: { config: { globalProperties: { $vitral?: VitralContext } } } } }) | undefined)?.ctx;
    return owner?.appContext?.config.globalProperties.$vitral;
}
