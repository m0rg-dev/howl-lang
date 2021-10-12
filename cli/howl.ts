import * as child_process from 'child_process';
import * as fs from 'fs';
import { chdir } from 'process';
import * as sms from 'source-map-support';
import { BuildPackage } from '../driver/Driver';
import { EmitC, EmitForwardDeclarations, EmitStructures, StandardHeaders } from '../generator/CGenerator';
import { Classes, Functions, InitRegistry } from '../registry/Registry';
import { RunClassTransforms, RunFunctionTransforms } from '../transform/RunTransforms';
import { ConcreteType } from '../type_inference/ConcreteType';
import { StructureType } from '../type_inference/StructureType';
import path = require('path');

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
            `-DHOWL_ENTRY=__Main`
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
        `-DHOWL_ENTRY=__Main`
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
    `-DHOWL_ENTRY=__Main`,
    "assets/runtime.c",
    "-O2",
    "-flto",
], {
    stdio: "inherit"
});

