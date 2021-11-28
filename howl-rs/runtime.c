#include "runtime.h"
// #include "declarations.h"
#include <stdio.h>
#include <string.h>
#include <sys/errno.h>

jmp_buf cur_handler;
struct object cur_exception;

int32_t main() {
  // Handle uncaught exceptions.
  if (setjmp(cur_handler)) {
    fprintf(stderr, "UNHANDLED EXCEPTION: %s %s\n",
            cur_exception.stable->__typename,
            ((struct P3EZ3lib9Exception_t *)cur_exception.obj)
                ->message.obj->contents.obj->value);
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

int32_t __get_errno() { return errno; }
char *__get_object_pointer(void *o) { return ((char **)o)[0]; }