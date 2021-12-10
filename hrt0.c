#include <setjmp.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/errno.h>

int __checknull(void *ptr) { return ptr == 0; }

int __get_errno() { return errno; }

jmp_buf cur_handler;
struct object {
  void *obj;
  void *table;
} cur_exception;

void jmp_dmp() {
  for (int i = 0; i < sizeof(jmp_buf) / sizeof(int); i++) {
    fprintf(stderr, "%02x ", cur_handler[i]);
  }
  fprintf(stderr, "\n");
}

void *__exc_push() {
  jmp_buf *rc = calloc(sizeof(jmp_buf), 1);
  memcpy(rc, &cur_handler, sizeof(jmp_buf));
  return rc;
}

int *__jmp_buf() { return &cur_handler[0]; }

void __exc_pop(jmp_buf *handler) {
  memcpy(&cur_handler, handler, sizeof(jmp_buf));
  free(handler);
}

struct object *__exc_get() {
  return &cur_exception;
}

__attribute__((noreturn)) void __exc_throw(struct object *e) {
  cur_exception = *e;
  longjmp(cur_handler, 1);
}
