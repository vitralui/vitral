import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Avatar from '../Avatar/Avatar.vue';
import AvatarGroup from './AvatarGroup.vue';

const three = { default: [1, 2, 3].map((n) => `<span class="vt-avatar">${n}</span>`).join('') };

describe('AvatarGroup', () => {
    it('groups the avatars inside it', () => {
        const wrapper = mountVt(AvatarGroup, { slots: three });
        expect(wrapper.classes()).toContain('vt-avatargroup');
        expect(wrapper.findAll('.vt-avatar')).toHaveLength(3);
    });

    it('is a named group only when it has a name', () => {
        expect(mountVt(AvatarGroup, { slots: three }).attributes('role')).toBeUndefined();
        const named = mountVt(AvatarGroup, { props: { label: 'Reviewers' }, slots: three });
        expect(named.attributes('role')).toBe('group');
        expect(named.attributes('aria-label')).toBe('Reviewers');
    });

    it('has no accessibility violations', async () => {
        mountVt(AvatarGroup, {
            props: { label: 'Reviewers' },
            slots: { default: () => [1, 2].map(() => ({ render: () => null })) }
        });
        mountVt(Avatar, { props: { label: 'GW' } });
        await expectNoA11yViolations();
    });
});
