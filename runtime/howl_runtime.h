#include <setjmp.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

struct stable_common {
  char *__typename;
  struct stable_common *parent;
};

struct object {
  void *obj;
  struct stable_common *stable;
};

jmp_buf cur_handler;
struct object cur_exception;

int32_t main__Main();
int32_t main() {
  // Handle uncaught exceptions.
  if (setjmp(cur_handler)) {
    fprintf(stderr, "UNHANDLED EXCEPTION: %s\n",
            cur_exception.stable->__typename);
    return 255;
  }
  return main__Main();
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