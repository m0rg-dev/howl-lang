#include <setjmp.h>
#include <stdint.h>

#ifndef RUNTIME_H
#define RUNTIME_H

struct stable_common {
  char *__typename;
  struct stable_common *parent;
};

struct object {
  void *obj;
  struct stable_common *stable;
};

extern jmp_buf cur_handler;
extern struct object cur_exception;

int32_t HOWL_ENTRY();
int typeIncludes(struct stable_common stable, char *type);

int32_t __get_errno();
char *__get_object_pointer(void *o);

#endif
