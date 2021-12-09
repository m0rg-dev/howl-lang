#include <sys/errno.h>

int __get_errno() { return errno; }
