import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
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
    console.error(`Compiling: ${f.parent || "<top-level>"}.${f.name}`);
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

fs.rmSync(path.join(pkg_dir, "target", "src"), { recursive: true, force: true });

fs.mkdirSync(path.join(pkg_dir, "target", "src"), { recursive: true });
fs.writeFileSync(path.join(pkg_dir, "target", "src", "runtime.c"), fs.readFileSync("/snapshot/howl-lang/assets/runtime.c"));
fs.writeFileSync(path.join(pkg_dir, "target", "src", "runtime.h"), fs.readFileSync("/snapshot/howl-lang/assets/runtime.h"));

fs.writeFileSync(path.join(pkg_dir, "target", "src", "declarations.h"), StandardHeaders()
    + "#pragma once\n\n" + fs.readFileSync("/snapshot/howl-lang/assets/runtime.h") + decl.join("\n"));

const sources: string[] = [];

Classes.forEach(c => {
    if (c.is_monomorphization) {
        fs.mkdirSync(path.dirname(path.join(pkg_dir, "target", "src", ...c.name.split("."))), { recursive: true });
        fs.writeFileSync(path.join(pkg_dir, "target", "src", ...c.name.split(".")) + ".c",
            `#include "${path.relative(path.join(pkg_dir, "target", "src", ...c.name.split(".").slice(0, -1)), path.join(pkg_dir, "target", "src", "declarations.h"))}"\n\n`
            + StandardHeaders()
            + EmitC(c));

        sources.push(path.join(pkg_dir, "target", "src", ...c.name.split(".")));
    }
});

Functions.forEach(f => {
    fs.mkdirSync(path.dirname(path.join(pkg_dir, "target", "src", ...f.full_name().split("."))), { recursive: true });
    fs.writeFileSync(path.join(pkg_dir, "target", "src", ...f.full_name().split(".")) + ".c",
        `#include "${path.relative(path.join(pkg_dir, "target", "src", ...f.full_name().split(".").slice(0, -1)), path.join(pkg_dir, "target", "src", "declarations.h"))}"\n\n`
        + StandardHeaders()
        + EmitC(f));

    sources.push(path.join(pkg_dir, "target", "src", ...f.full_name().split(".")));
});

const currently_running = new Map<number, Promise<number>>();
var n = 0;

async function doCompile() {
    while (n < sources.length) {
        if (currently_running.size < os.cpus().length) {
            const src = sources[n];
            console.error(`CC: ${src}`);
            const id = n;
            n++;
            currently_running.set(id, new Promise<number>((resolve, reject) => {
                const proc = child_process.spawn("cc", [
                    "-c",
                    "-o", src + ".o",
                    src + ".c",
                    "-O2",
                    "-Wno-pointer-sign",
                    "-Wno-unused-result",
                    `-DHOWL_ENTRY=__Main`
                ], {
                    stdio: "inherit"
                });
                proc.on("exit", (code, signal) => {
                    if (code) {
                        reject(`subprocess exited with code ${code}`);
                        process.exit(1);
                    }

                    if (signal) {
                        reject(`subprocess exited with signal ${signal}`);
                        process.exit(1);
                    }
                    resolve(id);
                });
            }));
        } else {
            const m = await Promise.race([...currently_running].map(v => v[1]));
            currently_running.delete(m);
        }
    }

    await Promise.all([...currently_running].map(v => v[1]));

    console.error(`LD: ${path.join(pkg_dir, "target", "bin", mf.entry)}`);
    fs.mkdirSync(path.dirname(path.join(pkg_dir, "target", "bin", mf.entry)), { recursive: true });
    child_process.spawnSync("cc", [
        "-o", path.join(pkg_dir, "target", "bin", mf.entry),
        ...sources.map(x => x + ".o"),
        `-DHOWL_ENTRY=__Main`,
        path.join(pkg_dir, "target", "src", "runtime.c"),
        "-O2",
        "-flto",
    ], {
        stdio: "inherit"
    });

}

doCompile();

