#!/usr/bin/env bash

for f in unit_tests/*.hl; do
    rm -f /tmp/howl_unit /tmp/howl_run /tmp/howl_compile
    echo -n "$f... "
    
    if java -jar target/howlc-1.0-SNAPSHOT.jar "$f" -o /tmp/howl_unit 2>/tmp/howl_compile; then
        if /tmp/howl_unit 2>/tmp/howl_run; then
            echo "ok"
        else
            echo "failed"
            cat /tmp/howl_run
        fi
    else
        echo "failed (compiler)"
        cat /tmp/howl_compile
    fi
done
