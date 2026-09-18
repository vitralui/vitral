import { graduationCap } from '@vitral/icons';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, markRaw, nextTick, reactive } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Button from '../Button/Button.vue';
import Menu from '../Menu/Menu.vue';
import Icon from './Icon.vue';

// Shaped like lucide-vue-next's icons: a component taking size and stroke-width and drawing an <svg>.
const LucideLike = defineComponent({
    name: 'Camera',
    props: { size: [Number, String], strokeWidth: [Number, String] },
    setup: (props) => () => h('svg', { class: 'lucide lucide-camera', width: props.size ?? 24, height: props.size ?? 24, 'stroke-width': props.strokeWidth ?? 2, viewBox: '0 0 24 24' }, [h('circle', { cx: 12, cy: 13, r: 3 })])
});

// A functional wrapper, the way another library's component is adapted (FontAwesomeIcon with its own prop).
const Wrapped = () => h('svg', { 'data-lib': 'wrapped', viewBox: '0 0 512 512' }, [h('path', { d: 'M0 0h512v512H0z', fill: 'currentColor' })]);

const svg = () => document.querySelector('.vt-icon')!;

describe('Icon', () => {
    it('draws a registered name and an imported definition as our own SVG', () => {
        mountVt(Icon, { props: { icon: 'search' } });
        expect(svg().tagName.toLowerCase()).toBe('svg');
        expect(svg().getAttribute('viewBox')).toBe('0 0 24 24');
        document.body.innerHTML = '';
        mountVt(Icon, { props: { icon: graduationCap } });
        const drawn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        drawn.innerHTML = graduationCap.body;
        expect(svg().innerHTML).toBe(drawn.innerHTML);
    });

    it('takes an icon font by its classes', () => {
        mountVt(Icon, { props: { icon: 'fa-solid fa-user', size: 20 } });
        const el = svg() as HTMLElement;
        expect(el.tagName.toLowerCase()).toBe('span');
        expect([...el.classList]).toEqual(expect.arrayContaining(['vt-icon', 'fa-solid', 'fa-user']));
        expect(el.style.fontSize).toBe('20px');
        expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it("renders another library's component with our class, size, stroke and accessibility", () => {
        mountVt(Icon, { props: { icon: LucideLike, size: 32, strokeWidth: 1.5, label: 'Camera' } });
        const el = svg() as SVGElement;
        expect([...el.classList]).toEqual(expect.arrayContaining(['vt-icon', 'vt-icon-external', 'lucide', 'lucide-camera']));
        expect(el.style.width).toBe('32px');
        expect(el.style.strokeWidth).toBe('1.5');
        expect(el.getAttribute('role')).toBe('img');
        expect(el.getAttribute('aria-label')).toBe('Camera');
    });

    it('renders a functional wrapper, and a component kept in reactive state, without warnings', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const state = reactive({ icon: LucideLike as unknown });
        mountVt(defineComponent(() => () => [h(Icon, { icon: Wrapped }), h(Icon, { icon: state.icon as typeof LucideLike })]));
        expect(document.querySelector('[data-lib="wrapped"]')!.classList.contains('vt-icon')).toBe(true);
        expect(document.querySelector('.lucide-camera')).not.toBeNull();
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('inserts trusted SVG markup inside the icon box', () => {
        mountVt(Icon, { props: { icon: '<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>' } });
        const el = svg();
        expect(el.tagName.toLowerCase()).toBe('span');
        expect(el.classList.contains('vt-icon-markup')).toBe(true);
        expect(el.querySelector('svg rect')).not.toBeNull();
    });

    it('reaches components through their icon props and models', async () => {
        const model = [{ label: 'Photo', icon: markRaw(LucideLike) }, { label: 'Profile', icon: 'fa-solid fa-user' }, { label: 'Course', icon: graduationCap }];
        mountVt(defineComponent(() => () => [h(Button, { label: 'Shoot', icon: LucideLike }), h(Button, { label: 'Me', icon: 'pi pi-user' }), h(Menu, { model })]));
        await nextTick();
        const button = document.querySelector('.vt-button')!;
        expect(button.querySelector('.lucide-camera.vt-icon')).not.toBeNull();
        expect(document.querySelectorAll('.vt-button')[1]!.querySelector('.pi.pi-user')).not.toBeNull();
        const menu = document.querySelector('[role="menu"]')!;
        expect(menu.querySelector('.lucide-camera')).not.toBeNull();
        expect(menu.querySelector('.fa-user')).not.toBeNull();
        const ours = Array.from(menu.querySelectorAll('svg.vt-icon')).filter((el) => !el.classList.contains('vt-icon-external'));
        expect(ours).toHaveLength(1);
        expect(ours[0]!.getAttribute('viewBox')).toBe('0 0 24 24');
        await expectNoA11yViolations();
    });
});
