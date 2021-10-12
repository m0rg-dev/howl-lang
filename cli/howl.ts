import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { chdir } from 'process';
import * as sms from 'source-map-support';
import { URL } from 'url';
import { EmptyManifest, Manifest, MergeManifest } from '../config/manifest';
import { ParseFile, Rebase } from '../driver/Driver';
import { EmitC, EmitForwardDeclarations, EmitStructures, StandardHeaders } from '../generator/CGenerator';
import { Classes, Functions, InitRegistry, SetCurrentNamespace } from '../registry/Registry';
import { RunClassTransforms, RunFunctionTransforms } from '../transform/RunTransforms';
import { ConcreteType } from '../type_inference/ConcreteType';
import { StructureType } from '../type_inference/StructureType';

sms.install();

chdir(process.cwd());

InitRegistry();

const pkg_dir = process.argv[2];

const mf = BuildPackage(process.argv[2]);

Classes.forEach(c => {
    console.error(`Compiling: ${c.name}`);
    c.fields.forEach(f => {
        if (f.type instanceof ConcreteType && Classes.has(f.type.name)) {
            const cl = Classes.get(f.type.name);
            f.type = cl.type();
            f.generics.forEach((g, idx) => (f.type as StructureType).generic_map.set(cl.generics[idx], g));
        }
    });

    RunClassTransforms(c);
});

Functions.forEach(f => {
    console.error(`Compiling: ${f.full_name()}`);
    RunFunctionTransforms(f);
});

const decl: string[] = [];

Classes.forEach(c => {
    c.dropBaseMethods();
    decl.push(EmitForwardDeclarations(c));
});

Classes.forEach(c => {
    if (c.is_monomorphization) {
        decl.push(EmitStructures(c));
    }
});

fs.rmSync(path.join(pkg_dir, "target", "src"), { recursive: true });

fs.mkdirSync(path.join(pkg_dir, "target", "src"), { recursive: true });
fs.writeFileSync(path.join(pkg_dir, "target", "src", "declarations.h"), StandardHeaders()
    + "#pragma once\n\n" + fs.readFileSync("/snapshot/howl-lang/assets/runtime.h") + decl.join("\n"));

const objects: string[] = [];

Classes.forEach(c => {
    if (c.is_monomorphization) {
        console.error(`CC: ${path.join(pkg_dir, "target", "src", ...c.name.split(".")) + ".o"}`);
        fs.mkdirSync(path.dirname(path.join(pkg_dir, "target", "src", ...c.name.split("."))), { recursive: true });
        fs.writeFileSync(path.join(pkg_dir, "target", "src", ...c.name.split(".")) + ".c",
            `#include "${path.relative(path.join(pkg_dir, "target", "src", ...c.name.split(".").slice(0, -1)), path.join(pkg_dir, "target", "src", "declarations.h"))}"\n\n`
            + StandardHeaders()
            + EmitC(c));

        child_process.spawnSync("cc", [
            "-c",
            "-o", path.join(pkg_dir, "target", "src", ...c.name.split(".")) + ".o",
            path.join(pkg_dir, "target", "src", ...c.name.split(".")) + ".c",
            "-O2",
            "-Wno-pointer-sign",
            "-Wno-unused-result",
            `-DHOWL_ENTRY=${mf.entry}__Main`
        ], {
            stdio: "inherit"
        });

        objects.push(path.join(pkg_dir, "target", "src", ...c.name.split(".")) + ".o");
    }
});

Functions.forEach(f => {
    console.error(`CC: ${path.join(pkg_dir, "target", "src", ...f.full_name().split(".")) + ".o"}`);
    fs.mkdirSync(path.dirname(path.join(pkg_dir, "target", "src", ...f.full_name().split("."))), { recursive: true });
    fs.writeFileSync(path.join(pkg_dir, "target", "src", ...f.full_name().split(".")) + ".c",
        `#include "${path.relative(path.join(pkg_dir, "target", "src", ...f.full_name().split(".").slice(0, -1)), path.join(pkg_dir, "target", "src", "declarations.h"))}"\n\n`
        + StandardHeaders()
        + EmitC(f));

    child_process.spawnSync("cc", [
        "-c",
        "-o", path.join(pkg_dir, "target", "src", ...f.full_name().split(".")) + ".o",
        path.join(pkg_dir, "target", "src", ...f.full_name().split(".")) + ".c",
        "-O2",
        "-Wno-pointer-sign",
        "-Wno-unused-result",
        `-DHOWL_ENTRY=${mf.entry}__Main`
    ], {
        stdio: "inherit"
    });

    objects.push(path.join(pkg_dir, "target", "src", ...f.full_name().split(".")) + ".o");
});

console.error(`LD: ${path.join(pkg_dir, "target", "bin", mf.entry)}`);
fs.mkdirSync(path.dirname(path.join(pkg_dir, "target", "bin", mf.entry)), { recursive: true });
child_process.spawnSync("cc", [
    "-o", path.join(pkg_dir, "target", "bin", mf.entry),
    ...objects,
    `-DHOWL_ENTRY=${mf.entry}__Main`,
    "assets/runtime.c",
    "-O2",
    "-flto",
], {
    stdio: "inherit"
});

function BuildPackage(pkg_path: string, prepend = ""): Manifest {
    const pkg_manifest = MergeManifest(
        MergeManifest(EmptyManifest, "/snapshot/howl-lang/assets/pack.json"),
        path.join(pkg_path, "pack.json")
    );

    Object.entries(pkg_manifest.always_import).forEach(v => {
        const depname = v[0];
        const url = new URL(v[1]);

        if (url.protocol != "file:") {
            throw new Error("non-file dependency URLS not yet supported");
        }

        if (url.pathname == pkg_path) {
            return;
        }

        BuildPackage(url.pathname, prepend + depname + ".");
    });

    if (pkg_manifest.entry) {
        ParseFile(pkg_path, path.join(pkg_path, pkg_manifest.entry + ".hl"), pkg_manifest, prepend);
        Rebase("module", pkg_manifest.entry);
        SetCurrentNamespace(pkg_manifest.entry);
    }

    pkg_manifest.export.forEach(x => {
        Rebase(x, "module");
    });


    return pkg_manifest;
}
