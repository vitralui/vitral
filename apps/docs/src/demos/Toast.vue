<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Toast',
    category: 'Messages',
    description: 'Notifications sent from anywhere with useToast, one or several at once, collapsed, pinned, with actions or following a promise, that pause their timer while hovered or focused.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Severities from './Toast/Severities.vue';
import StickyAndGrouped from './Toast/StickyAndGrouped.vue';
import Collapsed from './Toast/Collapsed.vue';
import FollowAPromise from './Toast/FollowAPromise.vue';
import Pile from './Toast/Pile.vue';
import PinnedAndActions from './Toast/PinnedAndActions.vue';
import QueueAndReplace from './Toast/QueueAndReplace.vue';
</script>

<template>
    <DemoSection title="Severities" description="Four seconds each; hover one to keep it."><Severities /></DemoSection>
    <DemoSection title="Sticky and grouped" description="Without a `life` a toast waits to be closed. A `group` sends it to another `<Toast>`, here one at the bottom."><StickyAndGrouped /></DemoSection>
    <DemoSection
        title="Several at once"
        description="`add` takes a list as well as one message. `max` caps the cards on screen: with `overflow` at `'queue'`, the default, the rest wait and each one's life starts only when it shows; with `'replace'`, the oldest card that is not pinned closes to make room. `newest-on-top` turns the order round."
        ><QueueAndReplace
    /></DemoSection>
    <DemoSection
        title="Collapsed into one"
        description="Messages that share a `collapseKey` share a card: the newest text, its life started again, and a count of how many came. Press the button a few times."
        ><Collapsed
    /></DemoSection>
    <DemoSection
        title="Pinned, with actions"
        description="A `pinned` message leads the stack, never times out and never waits behind `max`. `actions` puts buttons on the card; each closes it unless it says `keepOpen`, and the `action` event reports the press. `progress` draws the life left, holding while the card is read."
        ><PinnedAndActions
    /></DemoSection>
    <DemoSection
        title="Following a promise"
        description="`promise` shows one card while the work runs, with a spinner and no close button, and turns it into the success or the error when it settles. `update` changes any card in place by its id."
        ><FollowAPromise
    /></DemoSection>
    <DemoSection
        title="A pile"
        description="`stacked` draws the cards as a pile, the newest in front; pointed at or focused, it spreads and every countdown waits. On a phone a card can be swiped sideways to close it, which `swipe-to-close` turns off, and the countdowns hold while the page is in the background, which `pause-on-page-hidden` turns off."
        ><Pile
    /></DemoSection>
</template>
