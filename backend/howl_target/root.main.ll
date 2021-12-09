; ModuleID = 'root.main'
source_filename = "root.main"

%root.lib.IO_static = type <{ void (%root.lib.String)*, void (%root.lib.String)* }>
%root.lib.String = type <{ %root.lib.String_object*, %root.lib.String_static* }>
%root.lib.String_object = type <{ %root.lib.S3Vec1E2u8 }>
%root.lib.S3Vec1E2u8 = type <{ %root.lib.S3Vec1E2u8_object*, %root.lib.S3Vec1E2u8_static* }>
%root.lib.S3Vec1E2u8_object = type <{ i8*, i64, i64 }>
%root.lib.S3Vec1E2u8_static = type <{ void (%root.lib.S3Vec1E2u8, i8)*, i8 (%root.lib.S3Vec1E2u8, i64)*, void (%root.lib.S3Vec1E2u8)*, void (%root.lib.S3Vec1E2u8, i64, i8)*, i8 (%root.lib.S3Vec1E2u8)* }>
%root.lib.String_static = type <{ %root.lib.String (%root.lib.String, i64)*, %root.lib.String (%root.lib.String, %root.lib.Display)*, %root.lib.String (i8*, i64)*, void (%root.lib.String)*, %root.lib.String (%root.lib.String)*, %root.lib.String (i64)*, %root.lib.String (%root.lib.Display)*, %root.lib.String (%root.lib.String, %root.lib.String)* }>
%root.lib.Display = type <{ i8*, %root.lib.Display_interface* }>
%root.lib.Display_interface = type <{ %root.lib.String (%root.lib.Display)* }>

@root.lib.IO_static = external global %root.lib.IO_static
@root.lib.String_static = external global %root.lib.String_static

declare i64 @write(i32, i8*, i64)

declare i64 @read(i32, i8*, i64)

declare i32 @close(i32)

declare void @free(i8*)

declare i8* @strerror(i32)

declare i32 @__get_errno()

declare i32 @accept(i32, i8*, i32*)

declare i8* @malloc(i64)

declare i64 @strlen(i8*)

define i32 @root.main.Main() {
entry:
  %0 = load void (%root.lib.String)*, void (%root.lib.String)** getelementptr inbounds (%root.lib.IO_static, %root.lib.IO_static* @root.lib.IO_static, i32 0, i32 0), align 8
  %1 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %2 = alloca [18 x i8], align 1
  store [18 x i8] c"\22Hello, World!\\n\22\00", [18 x i8]* %2, align 1
  %3 = bitcast [18 x i8]* %2 to i8*
  %4 = alloca [18 x i8], align 1
  store [18 x i8] c"\22Hello, World!\\n\22\00", [18 x i8]* %4, align 1
  %5 = bitcast [18 x i8]* %4 to i8*
  %6 = call i64 @strlen(i8* %5)
  %7 = call %root.lib.String %1(i8* %3, i64 %6)
  call void %0(%root.lib.String %7)
  ret i32 0
}
