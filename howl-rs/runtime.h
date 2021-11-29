#include <setjmp.h>
#include <stdint.h>
#include <stdlib.h>

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

typedef int8_t i8;
typedef int32_t i32;
typedef int64_t i64;

typedef uint8_t u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef uint64_t u64;

void dummy_constructor();

#define CONSTRUCTOR(type, cfunc, order, ...)                                   \
  type type##_alloc(__VA_ARGS__) {                                             \
    type rc;                                                                   \
    rc.obj = calloc(1, sizeof(struct type##_t));                               \
    rc.stable = &type##_stable_obj;                                            \
    cfunc order;                                                               \
    return rc;                                                                 \
  }

#endif
