#include <stdio.h>
#include <sys/errno.h>

int __get_errno() { return errno; }

void test1(long i, char *s) { printf("%ld %s\n", i, s); }