<script setup lang="ts">
import { Button, Icon, Menu, type IconProp, type MenuItem } from '@vitral/vue';
import { computed, ref, useId, watch } from 'vue';
import { scrollTemplateTop, useNarrow, useTemplate } from './context';

/**
 * The chrome of a public site, a store or a paper or a blog: the brand, the
 * screens as links, a few actions, and a footer. Below 720px the links fold
 * into a menu button.
 *
 * A shop, a paper and a blog do not wear the same bar, so the two things that
 * actually differ are props — whether a strip runs above it, and whether the
 * brand leads or is centred with the links either side — and a second row is a
 * slot, for the categories or sections a site with many of them needs.
 */
interface Props {
    brand: string;
    brandIcon: IconProp;
    /** A strip above the bar: free delivery, a deadline, an edition. */
    announcement?: string;
    /** `'centre'` puts the brand in the middle with the links split around it, as a paper's masthead does. */
    layout?: 'start' | 'centre';
    /**
     * The header's links. By default each one opens the screen named by `id`;
     * `select` and `current` let one link stand for a screen in a given state
     * (a newspaper's sections all open the section screen).
     */
    links: { id: string; label: string; select?: () => void; current?: boolean }[];
    tagline?: string;
}

const props = withDefaults(defineProps<Props>(), { announcement: undefined, layout: 'start', tagline: undefined });

// Centred, the links are dealt either side of the brand; the odd one goes left,
// so a masthead with five sections is not lopsided the other way.
const half = computed(() => Math.ceil(props.links.length / 2));
const leading = computed(() => (props.layout === 'centre' ? props.links.slice(0, half.value) : props.links));
const trailing = computed(() => (props.layout === 'centre' ? props.links.slice(half.value) : []));

const { screen, go, standalone, narrow: shared } = useTemplate();
const root = ref<HTMLElement | null>(null);
const narrow = useNarrow(root);
watch(narrow, (value) => (shared.value = value), { immediate: true });
const menu = ref<InstanceType<typeof Menu> | null>(null);
const menuId = useId();

const open = (link: Props['links'][number]) => (link.select ? link.select() : go(link.id));
const isCurrent = (link: Props['links'][number]) => link.current ?? screen.value === link.id;
const items = computed<MenuItem[]>(() => props.links.map((link) => ({ label: link.label, key: link.id, command: () => open(link) })));
const home = computed(() => props.links[0]?.id ?? screen.value);

watch(screen, () => scrollTemplateTop(root.value, standalone()));
</script>

<template>
    <div ref="root" class="tp tp-store" :class="`tp-store-${layout}`">
        <p v-if="announcement" class="tp-store-strip">{{ announcement }}</p>
        <header class="tp-store-header">
            <div class="tp-wrap tp-store-bar">
                <nav v-if="!narrow && layout === 'centre'" class="tp-store-nav" :aria-label="`${brand} sections`">
                    <button v-for="link in leading" :key="link.id" type="button" :aria-current="isCurrent(link) ? 'page' : undefined" @click="open(link)">
                        {{ link.label }}
                    </button>
                </nav>
                <button type="button" class="tp-brand" @click="go(home)">
                    <span class="tp-brand-mark"
                        ><slot name="mark"><Icon :icon="brandIcon" /></slot
                    ></span>
                    {{ brand }}
                </button>
                <!-- The links after the brand and the actions travel together:
                     centred, they are the far half of the masthead; leading,
                     they are everything that is not the brand. -->
                <div class="tp-store-end">
                    <nav v-if="!narrow" class="tp-store-nav" :aria-label="layout === 'centre' ? `${brand} sections, continued` : `${brand} sections`">
                        <button v-for="link in layout === 'centre' ? trailing : leading" :key="link.id" type="button" :aria-current="isCurrent(link) ? 'page' : undefined" @click="open(link)">
                            {{ link.label }}
                        </button>
                    </nav>
                    <div class="tp-store-actions">
                        <slot name="actions" :narrow="narrow" />
                        <template v-if="narrow">
                            <Button
                                icon="menu"
                                variant="text"
                                severity="secondary"
                                :aria-label="`${brand} menu`"
                                aria-haspopup="true"
                                :aria-controls="menuId"
                                @click="menu?.toggle($event)"
                            />
                            <Menu :id="menuId" ref="menu" :model="items" popup :aria-label="`${brand} sections`" />
                        </template>
                    </div>
                </div>
            </div>
            <div v-if="$slots.subnav && !narrow" class="tp-store-subnav">
                <div class="tp-wrap"><slot name="subnav" /></div>
            </div>
        </header>

        <component :is="standalone() ? 'main' : 'div'" class="tp-store-main">
            <slot />
        </component>

        <footer class="tp-store-footer">
            <div class="tp-wrap tp-store-footer-inner">
                <div>
                    <strong>{{ brand }}</strong>
                    <p v-if="tagline">{{ tagline }}</p>
                </div>
                <slot name="footer" />
                <p class="tp-muted tp-small">A fictional brand, made with Vitral.</p>
            </div>
        </footer>
    </div>
</template>
