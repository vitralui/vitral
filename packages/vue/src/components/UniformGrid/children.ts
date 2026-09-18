import { Comment, Fragment, Text, isVNode, type VNode } from 'vue';

export interface SlotChild {
    node: VNode;
    /** Unique among the flattened children, so two `v-for`s with the same keys do not collide. */
    key: string;
}

/**
 * The children a slot rendered, the way a layout panel counts them: fragments
 * (`v-for`, `<template v-if>`) are opened, and `v-if` placeholders and
 * whitespace are dropped. Call it from the template — inside render — so the
 * slot tracks what it reads.
 */
export function flattenChildren(nodes: unknown, prefix = ''): SlotChild[] {
    const out: SlotChild[] = [];
    const list = Array.isArray(nodes) ? nodes : [nodes];
    list.forEach((node, index) => {
        if (Array.isArray(node)) {
            out.push(...flattenChildren(node, `${prefix}${index}.`));
            return;
        }
        if (!isVNode(node) || node.type === Comment) return;
        if (node.type === Text && typeof node.children === 'string' && !node.children.trim()) return;
        const own = String(node.key ?? index);
        if (node.type === Fragment) out.push(...flattenChildren(node.children, `${prefix}${own}.`));
        else out.push({ node, key: `${prefix}${own}` });
    });
    return out;
}
