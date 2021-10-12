import * as fs from 'fs';

export type Manifest = {
    always_import: {
        [key: string]: string
    },
    dependencies: {
        [key: string]: string
    },
    search_path: string[],
    export: string[],
    entry: string
};

export const EmptyManifest: Manifest = {
    always_import: {},
    dependencies: {},
    search_path: [],
    export: [],
    entry: undefined
};

export function MergeManifest(lower: Manifest, path: string): Manifest {
    lower = JSON.parse(JSON.stringify(lower));
    const source = fs.readFileSync(path).toString();
    // TODO
    const mf: Manifest = JSON.parse(source);

    if (mf.always_import) {
        Object.entries(mf.always_import).forEach(v => {
            lower.always_import[v[0]] = v[1];
        });
    }

    if (mf.dependencies) {
        Object.entries(mf.dependencies).forEach(v => {
            lower.dependencies[v[0]] = v[1];
        });
    }

    if (mf.search_path) {
        lower.search_path = [...mf.search_path, ...lower.search_path];
    }

    if (mf.export) {
        lower.export = [...mf.export, ...lower.export];
    }


    if (mf.entry) {
        lower.entry = mf.entry;
    }

    return lower;
}