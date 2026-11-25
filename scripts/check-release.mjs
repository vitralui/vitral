// After `pnpm -r publish`: every package of the release, and every @vitral/*
// version one of them depends on, must be on the registry to be installed.
// A publish can print `+ name@version` and still not land (staged, rejected),
// which is how @vitral/controls@0.2.25 went missing while the rest depended on it.
// Run: node scripts/check-release.mjs   (exits 1, listing what is missing)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'packages');
const manifests = readdirSync(root)
    .map((dir) => join(root, dir, 'package.json'))
    .filter(existsSync)
    .map((file) => JSON.parse(readFileSync(file, 'utf8')))
    .filter((pkg) => !pkg.private);

const wanted = new Map();
for (const pkg of manifests) {
    wanted.set(`${pkg.name}@${pkg.version}`, `released`);
    for (const deps of [pkg.dependencies, pkg.peerDependencies]) {
        for (const [name, range] of Object.entries(deps ?? {})) {
            if (!name.startsWith('@vitral/')) continue;
            const own = manifests.find((other) => other.name === name);
            // workspace:* (and friends) are published as the workspace's own version.
            const version = range.startsWith('workspace:') ? own?.version : range.replace(/^[\^~]/, '');
            if (version) wanted.set(`${name}@${version}`, wanted.get(`${name}@${version}`) ?? `needed by ${pkg.name}`);
        }
    }
}

const missing = [];
await Promise.all(
    [...wanted].map(async ([spec, why]) => {
        const at = spec.lastIndexOf('@');
        const [name, version] = [spec.slice(0, at), spec.slice(at + 1)];
        const response = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`);
        if (!response.ok) missing.push(`${spec} (${why}): ${response.status}`);
    })
);

if (missing.length) {
    console.error(`Not on the registry:\n  ${missing.sort().join('\n  ')}`);
    process.exit(1);
}
console.log(`All ${wanted.size} package versions are on the registry.`);
