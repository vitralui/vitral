import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import FileUpload from './FileUpload.vue';

const file = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });

function mountUpload(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(FileUpload, { props });
    const input = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const pick = async (...files: File[]) => {
        Object.defineProperty(input(), 'files', { value: files, configurable: true });
        input().dispatchEvent(new Event('change'));
        await nextTick();
    };
    const names = () => Array.from(document.querySelectorAll('.vt-fileupload-file-name')).map((n) => n.textContent);
    const alerts = () => Array.from(document.querySelectorAll('[role="alert"]')).map((a) => a.textContent?.trim());
    const button = (label: string) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === label)!;
    return { wrapper, input, pick, names, alerts, button };
}

describe('FileUpload', () => {
    afterEach(() => vi.restoreAllMocks());

    it('keeps a native file input, labelled by the choose button', () => {
        const { input } = mountUpload({ multiple: true, accept: 'image/*' });
        expect(input().labels?.[0]?.textContent?.trim()).toBe('Choose');
        expect(input().multiple).toBe(true);
        expect(input().accept).toBe('image/*');
        expect(document.querySelector('.vt-fileupload-empty')?.textContent).toContain('Drag and drop files here');
    });

    it('queues valid files with their sizes, and refuses the rest with alerts', async () => {
        const { pick, names, alerts, wrapper } = mountUpload({ multiple: true, accept: 'image/*', maxFileSize: 2000 });
        await pick(file('cat.png', 'image/png', 1500), file('notes.txt', 'text/plain', 10), file('huge.jpg', 'image/jpeg', 5000));
        expect(names()).toEqual(['cat.png']);
        expect(document.querySelector('.vt-fileupload-file-size')?.textContent).toBe('1.5 kB');
        expect(alerts()).toEqual([
            'notes.txt: this type of file is not allowed. Allowed: image/*.',
            'huge.jpg: the file is too large. The limit is 2 kB.'
        ]);
        expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ files: [expect.objectContaining({ name: 'cat.png' })] });
    });

    it('enforces the file limit', async () => {
        const { pick, names, alerts } = mountUpload({ multiple: true, fileLimit: 2 });
        await pick(file('a.txt', 'text/plain', 1), file('b.txt', 'text/plain', 1), file('c.txt', 'text/plain', 1));
        expect(names()).toEqual(['a.txt', 'b.txt']);
        expect(alerts()).toEqual(['Too many files. The limit is 2.']);
        expect(document.querySelector<HTMLInputElement>('input[type="file"]')!.disabled).toBe(true);
    });

    it('removes a file through a button named after it, and clears the queue', async () => {
        const { pick, names, button, wrapper } = mountUpload({ multiple: true });
        await pick(file('a.txt', 'text/plain', 1), file('b.txt', 'text/plain', 1));
        const remove = document.querySelector<HTMLButtonElement>('.vt-fileupload-file button')!;
        const label = remove.getAttribute('aria-labelledby')!.split(' ').map((id) => document.getElementById(id)?.getAttribute('aria-label') ?? document.getElementById(id)?.textContent);
        expect(label).toEqual(['Remove', 'a.txt']);
        remove.click();
        await nextTick();
        expect(names()).toEqual(['b.txt']);
        expect(wrapper.emitted('remove')).toHaveLength(1);
        button('Cancel').click();
        await nextTick();
        expect(names()).toEqual([]);
    });

    it('hands the files to the app with customUpload, uploading at once with auto', async () => {
        const { pick, wrapper } = mountUpload({ customUpload: true, auto: true });
        await pick(file('a.txt', 'text/plain', 1));
        expect(wrapper.emitted('uploader')?.[0]?.[0]).toMatchObject({ files: [expect.objectContaining({ name: 'a.txt' })] });
    });

    it('posts the files and marks them completed', async () => {
        const sent: FormData[] = [];
        class FakeXhr {
            upload = { addEventListener: () => {} };
            readyState = 0;
            status = 0;
            withCredentials = false;
            onreadystatechange: (() => void) | null = null;
            open() {}
            send(data: FormData) {
                sent.push(data);
                this.readyState = 4;
                this.status = 200;
                setTimeout(() => this.onreadystatechange?.());
            }
        }
        vi.stubGlobal('XMLHttpRequest', FakeXhr);
        const { pick, button, wrapper } = mountUpload({ url: '/upload', name: 'docs' });
        await pick(file('a.txt', 'text/plain', 3));
        button('Upload').click();
        await nextTick();
        expect(document.querySelector('[role="progressbar"]')).not.toBeNull();
        await new Promise((resolve) => setTimeout(resolve, 5));
        expect((sent[0]!.get('docs') as File).name).toBe('a.txt');
        expect(wrapper.emitted('upload')).toHaveLength(1);
        expect(document.querySelector('.vt-fileupload-file')?.textContent).toContain('Completed');
        vi.unstubAllGlobals();
    });

    it('posts a request per file with requestPerFile, each with its own bar', async () => {
        const requests: { data: FormData; progress: (e: ProgressEvent) => void; finish: (status: number) => void }[] = [];
        class FakeXhr {
            listeners: ((e: ProgressEvent) => void)[] = [];
            upload = { addEventListener: (_: string, fn: (e: ProgressEvent) => void) => this.listeners.push(fn) };
            readyState = 0;
            status = 0;
            withCredentials = false;
            onreadystatechange: (() => void) | null = null;
            open() {}
            send(data: FormData) {
                requests.push({
                    data,
                    progress: (e) => this.listeners.forEach((fn) => fn(e)),
                    finish: (status) => {
                        this.readyState = 4;
                        this.status = status;
                        this.onreadystatechange?.();
                    }
                });
            }
        }
        vi.stubGlobal('XMLHttpRequest', FakeXhr);
        const { pick, button, names, wrapper } = mountUpload({ url: '/upload', multiple: true, requestPerFile: true });
        await pick(file('a.txt', 'text/plain', 3), file('b.txt', 'text/plain', 4));
        button('Upload').click();
        await nextTick();
        expect(requests.map((r) => (r.data.getAll('files[]') as File[]).map((f) => f.name))).toEqual([['a.txt'], ['b.txt']]);
        const bars = () => Array.from(document.querySelectorAll<HTMLElement>('.vt-fileupload-file [role="progressbar"]'));
        expect(bars()).toHaveLength(2);
        expect(document.getElementById(bars()[0]!.getAttribute('aria-labelledby')!)?.textContent).toBe('a.txt');
        requests[0]!.progress(new ProgressEvent('progress', { lengthComputable: true, loaded: 50, total: 100 }));
        await nextTick();
        expect(bars()[0]!.getAttribute('aria-valuenow')).toBe('50');
        expect(wrapper.emitted('progress')!.at(-1)![0]).toMatchObject({ progress: 25, fileProgress: 50 });
        // One finishes: it leaves the queue while the other is still going.
        requests[1]!.finish(200);
        await nextTick();
        expect(names()).toEqual(['a.txt', 'b.txt']);
        expect(document.querySelectorAll('.vt-fileupload-file')[0]!.textContent).not.toContain('Completed');
        requests[0]!.finish(500);
        await nextTick();
        expect(wrapper.emitted('upload')).toHaveLength(1);
        expect(wrapper.emitted('error')).toHaveLength(1);
        expect(bars()).toHaveLength(0);
        vi.unstubAllGlobals();
    });

    it('queues dropped files', async () => {
        const { names } = mountUpload();
        const drop = new Event('drop', { cancelable: true }) as DragEvent;
        Object.defineProperty(drop, 'dataTransfer', { value: { files: [file('dropped.png', 'image/png', 2)] } });
        document.querySelector('.vt-fileupload')!.dispatchEvent(drop);
        await nextTick();
        expect(names()).toEqual(['dropped.png']);
    });

    it('offers one button in basic mode, naming the chosen file', async () => {
        const { pick, input } = mountUpload({ mode: 'basic' });
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(input().labels?.[0]?.textContent?.trim()).toBe('Choose');
        await pick(file('a.txt', 'text/plain', 1));
        expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('a.txt');
    });

    it('has no accessibility violations, empty or with files and messages', async () => {
        const { pick } = mountUpload({ multiple: true, maxFileSize: 5 });
        await expectNoA11yViolations();
        await pick(file('a.txt', 'text/plain', 1), file('b.txt', 'text/plain', 10));
        await expectNoA11yViolations();
    });
});
