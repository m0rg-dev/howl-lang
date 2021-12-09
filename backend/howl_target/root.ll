; ModuleID = 'root'
source_filename = "root"

declare i64 @write(i32, i8*, i64)

declare i64 @read(i32, i8*, i64)

declare i32 @close(i32)

declare void @free(i8*)

declare i8* @strerror(i32)

declare i32 @__get_errno()

declare i32 @accept(i32, i8*, i32*)

declare i8* @malloc(i64)

declare i64 @strlen(i8*)
