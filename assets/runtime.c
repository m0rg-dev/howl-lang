#include "runtime.h"
#include <stdio.h>
#include <string.h>

jmp_buf cur_handler;
struct object cur_exception;

int32_t main() {
  // Handle uncaught exceptions.
  if (setjmp(cur_handler)) {
    fprintf(stderr, "UNHANDLED EXCEPTION: %s\n",
            cur_exception.stable->__typename);
    return 255;
  }
  return HOWL_ENTRY();
}

int typeIncludes(struct stable_common stable, char *type) {
  if (!strcmp(stable.__typename, type)) {
    return 1;
  }

  if (stable.parent) {
    return typeIncludes(*stable.parent, type);
  }

  return 0;
}
