// `virtual:vitral-changes`: what the last few releases added and changed, and
// the version the site is documenting. Nothing is written down for it: the
// releases are the `vX.Y.Z` tags, and a component's API at each of them is its
// `types.ts` as it was, read out of git and compared with the release before.
//
//     import { version, components } from 'virtual:vitral-changes';
//     // version    → '0.2.18', from packages/vue/package.json
//     // components → { Schedule: { status: 'changed', version: '0.2.18',
//     //                            props: { eventMaxStack: { status: 'new', version: '0.2.17' } } } }
//
// A component is new in the release its folder first appears in, and changed in
// one where its API differs or a file of its own does: its folder in
// `@vitral/vue`, its stylesheet, or the addon package it draws with. A member is
// new in the release it first appears in and changed where its type differs.
// Only the last `recent` releases are reported, which is what "recently" means
// on the site.
//
// The working tree is the last step. With a version no tag has yet it is that
// release, about to be cut; otherwise whatever differs from the last tag is
// reported under `next`. Without git, or in a clone with no tags (a shallow
// checkout), there is no history to read and the site simply shows no badges.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { parseApi } from './api-members.ts';

export type ChangeKind = 'props' | 'emits' | 'slots';

export interface Change {
    status: 'new' | 'changed';
    /** The release it happened in, or `next` for one that is not cut yet. */
    version: string;
}

export interface ComponentChange extends Change {
    props?: Record<string, Change>;
    emits?: Record<string, Change>;
    slots?: Record<string, Change>;
}

/** The repository at one release. */
export interface Snapshot {
    version: string;
    /** Every component there was, by folder name, with its `types.ts` (empty without one). */
    types: Map<string, string>;
    /** `base/types.ts`, where the props a family shares are declared. */
    shared: string;
    /** Components with a file of their own that differs from the snapshot before. */
    touched: Set<string>;
    /** A component that was another one in the snapshot before: new name → old name. */
    renamed: Map<string, string>;
}

const KINDS: ChangeKind[] = ['props', 'emits', 'slots'];
const NEXT = 'next';

interface Record_ {
    added?: string;
    updated?: string;
    /** What each member is, as text: two releases agree on a member when this is the same. */
    api: Record<ChangeKind, Map<string, string>>;
    members: Record<ChangeKind, Map<string, { added?: string; changed?: string }>>;
}

function signatures(source: string, component: string, shared: string): Record_['api'] {
    const api = source ? parseApi(source, component, shared) : { props: [], emits: [], slots: [] };
    const of = (kind: ChangeKind) => new Map(api[kind].map((member) => [member.name, `${member.optional ? '?' : ''}${member.type}`]));
    return { props: of('props'), emits: of('emits'), slots: of('slots') };
}

/** What the last `recent` snapshots added and changed, by component. The first snapshot is where history starts: nothing in it is new. */
export function history(snapshots: Snapshot[], recent = 3): Record<string, ComponentChange> {
    let state = new Map<string, Record_>();

    snapshots.forEach((snapshot, index) => {
        const { version } = snapshot;
        const next = new Map<string, Record_>();
        for (const [name, source] of snapshot.types) {
            const api = signatures(source, name, snapshot.shared);
            const was = snapshot.renamed.get(name);
            const from = state.get(name) ?? (was ? state.get(was) : undefined);
            const record: Record_ = { api, members: { props: new Map(), emits: new Map(), slots: new Map() } };

            if (from) {
                record.added = from.added;
                record.updated = from.updated;
                let differs = snapshot.touched.has(name) || !state.has(name);
                for (const kind of KINDS) {
                    for (const [member, signature] of api[kind]) {
                        const before = from.api[kind].get(member);
                        const marks = { ...from.members[kind].get(member) };
                        if (before === undefined) marks.added = version;
                        else if (before !== signature) marks.changed = version;
                        if (before !== signature) differs = true;
                        if (marks.added || marks.changed) record.members[kind].set(member, marks);
                    }
                    if ([...from.api[kind].keys()].some((member) => !api[kind].has(member))) differs = true;
                }
                if (differs) record.updated = version;
            } else if (index > 0) {
                record.added = version;
            }
            next.set(name, record);
        }
        state = next;
    });

    const releases = snapshots.map((snapshot) => snapshot.version).filter((version) => version !== NEXT);
    const isRecent = (version?: string): version is string => version !== undefined && (version === NEXT || releases.slice(-recent).includes(version));
    const change = (added?: string, changed?: string): Change | undefined =>
        isRecent(added) ? { status: 'new', version: added } : isRecent(changed) ? { status: 'changed', version: changed } : undefined;

    const out: Record<string, ComponentChange> = {};
    for (const [name, record] of [...state].sort(([a], [b]) => a.localeCompare(b))) {
        const own = change(record.added, record.updated);
        if (!own) continue;
        const entry: ComponentChange = { ...own };
        for (const kind of KINDS) {
            const members = [...record.members[kind]].flatMap(([member, marks]) => {
                const mark = change(marks.added, marks.changed);
                return mark ? [[member, mark] as const] : [];
            });
            if (members.length) entry[kind] = Object.fromEntries(members);
        }
        out[name] = entry;
    }
    return out;
}

// ---- reading the repository -------------------------------------------------

const COMPONENTS = 'packages/vue/src/components';
const SHARED = 'packages/vue/src/base/types.ts';
/** Packages every component is built on: a change in one is not a change to the components that import it. */
const FOUNDATIONS = new Set(['core', 'dom', 'styles', 'themes', 'icons', 'vue']);

const byVersion = (a: string, b: string) => {
    const [x, y] = [a, b].map((tag) => tag.slice(1).split('.').map(Number));
    return x![0]! - y![0]! || x![1]! - y![1]! || x![2]! - y![2]!;
};

/** The addon packages, each with the components that import it, as the working tree has them. */
function addonOwners(root: string, components: string[]): Map<string, string[]> {
    const owners = new Map<string, string[]>();
    for (const name of components) {
        const dir = join(root, COMPONENTS, name);
        const packages = new Set<string>();
        for (const file of readdirSync(dir)) {
            if (!/\.(vue|ts)$/.test(file) || file.endsWith('.spec.ts')) continue;
            for (const match of readFileSync(join(dir, file), 'utf8').matchAll(/from '@vitral\/([\w-]+)/g)) packages.add(match[1]!);
        }
        for (const pkg of packages) if (!FOUNDATIONS.has(pkg)) owners.set(pkg, [...(owners.get(pkg) ?? []), name]);
    }
    return owners;
}

/** Reads the tags and the working tree into snapshots, oldest first. Throws when git cannot be asked. */
export function readSnapshots(root: string): Snapshot[] {
    const git = (args: string[], input?: string) =>
        execFileSync('git', args, { cwd: root, input, maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = (args: string[]) => git(args).toString('utf8').split('\n').filter(Boolean);

    const tags = lines(['tag', '--list', 'v*']).filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag)).sort(byVersion);
    if (!tags.length) return [];

    // The components of each tag, then every `types.ts` among them in one read.
    const listed = tags.map((tag) => {
        const files = lines(['ls-tree', '-r', '--name-only', tag, '--', COMPONENTS]);
        const names = new Set(files.map((file) => file.slice(COMPONENTS.length + 1).split('/')).filter((parts) => parts.length > 1).map((parts) => parts[0]!));
        return { tag, names: [...names], typed: new Set(files.filter((file) => file.endsWith('/types.ts')).map((file) => file.split('/').at(-2)!)) };
    });
    const wanted = listed.flatMap(({ tag, names, typed }) => [`${tag}:${SHARED}`, ...names.filter((name) => typed.has(name)).map((name) => `${tag}:${COMPONENTS}/${name}/types.ts`)]);
    const blobs = new Map<string, string>();
    const batch = git(['cat-file', '--batch'], `${wanted.join('\n')}\n`);
    for (let at = 0, i = 0; i < wanted.length; i++) {
        // `<sha> blob <size>\n<bytes>\n`, or `<name> missing\n`.
        const end = batch.indexOf(10, at);
        const head = batch.toString('utf8', at, end);
        const size = Number(head.match(/ blob (\d+)$/)?.[1] ?? -1);
        if (size < 0) at = end + 1;
        else {
            blobs.set(wanted[i]!, batch.toString('utf8', end + 1, end + 1 + size));
            at = end + 1 + size + 1;
        }
    }

    const treeNames = readdirSync(join(root, COMPONENTS)).filter((name) => statSync(join(root, COMPONENTS, name)).isDirectory());
    const addons = addonOwners(root, treeNames);

    /** What differs between two points, as the components it belongs to and the renames among them. */
    const differences = (range: string[], names: string[]) => {
        const touched = new Set<string>();
        const renamed = new Map<string, string>();
        const lower = new Map(names.map((name) => [name.toLowerCase(), name]));
        const owner = (path: string): string[] => {
            if (path.endsWith('.spec.ts')) return [];
            const component = path.match(new RegExp(`^${COMPONENTS}/([^/]+)/`))?.[1];
            if (component) return [component];
            const style = path.match(/^packages\/styles\/src\/([^/]+)\//)?.[1];
            if (style) return lower.has(style) ? [lower.get(style)!] : [];
            const pkg = path.match(/^packages\/([^/]+)\/src\//)?.[1];
            return (pkg && addons.get(pkg)) || [];
        };
        for (const line of lines(['diff', '--name-status', '-M', ...range, '--', 'packages'])) {
            const [status, ...paths] = line.split('\t');
            for (const path of paths) for (const name of owner(path)) touched.add(name);
            if (status!.startsWith('R')) {
                const [from, to] = paths.map((path) => path.match(new RegExp(`^${COMPONENTS}/([^/]+)/`))?.[1]);
                if (from && to && from !== to && !names.includes(from)) renamed.set(to, from);
            }
        }
        return { touched, renamed };
    };

    const snapshots: Snapshot[] = listed.map(({ tag, names }, index) => ({
        version: tag.slice(1),
        types: new Map(names.map((name) => [name, blobs.get(`${tag}:${COMPONENTS}/${name}/types.ts`) ?? ''])),
        shared: blobs.get(`${tag}:${SHARED}`) ?? '',
        ...(index ? differences([tags[index - 1]!, tag], names) : { touched: new Set<string>(), renamed: new Map<string, string>() })
    }));

    const version = currentVersion(root);
    const read = (file: string) => (existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : '');
    snapshots.push({
        version: tags.includes(`v${version}`) ? NEXT : version,
        types: new Map(treeNames.map((name) => [name, read(`${COMPONENTS}/${name}/types.ts`)])),
        shared: read(SHARED),
        ...differences([tags.at(-1)!], treeNames)
    });
    return snapshots;
}

/** The version being documented: every package carries the same one. */
export function currentVersion(root: string): string {
    return (JSON.parse(readFileSync(join(root, 'packages/vue/package.json'), 'utf8')) as { version: string }).version;
}

const ID = 'virtual:vitral-changes';
const RESOLVED = `\0${ID}`;

export function changes({ recent = 3 }: { recent?: number } = {}): Plugin {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    return {
        name: 'vitral-changes',
        resolveId: (source) => (source === ID ? RESOLVED : null),
        load(id) {
            if (id !== RESOLVED) return null;
            let components: Record<string, ComponentChange> = {};
            try {
                components = history(readSnapshots(root), recent);
            } catch (error) {
                this.warn(`no release history, so no "new" and "changed" badges: ${(error as Error).message}`);
            }
            return `export const version = ${JSON.stringify(currentVersion(root))};\nexport const components = ${JSON.stringify(components)};\n`;
        }
    };
}
