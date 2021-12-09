; ModuleID = 'root.lib'
source_filename = "root.lib"

%root.lib.Exception_static = type <{ void (%root.lib.Exception, %root.lib.String)* }>
%root.lib.Exception = type <{ %root.lib.Exception_object*, %root.lib.Exception_static* }>
%root.lib.Exception_object = type <{ %root.lib.String }>
%root.lib.String = type <{ %root.lib.String_object*, %root.lib.String_static* }>
%root.lib.String_object = type <{ %root.lib.S3Vec1E2u8 }>
%root.lib.S3Vec1E2u8 = type <{ %root.lib.S3Vec1E2u8_object*, %root.lib.S3Vec1E2u8_static* }>
%root.lib.S3Vec1E2u8_object = type <{ i8*, i64, i64 }>
%root.lib.S3Vec1E2u8_static = type <{ void (%root.lib.S3Vec1E2u8, i8)*, i8 (%root.lib.S3Vec1E2u8, i64)*, void (%root.lib.S3Vec1E2u8)*, void (%root.lib.S3Vec1E2u8, i64, i8)*, i8 (%root.lib.S3Vec1E2u8)* }>
%root.lib.String_static = type <{ %root.lib.String (%root.lib.String, i64)*, %root.lib.String (%root.lib.String, %root.lib.Display)*, %root.lib.String (i8*, i64)*, void (%root.lib.String)*, %root.lib.String (%root.lib.String)*, %root.lib.String (i64)*, %root.lib.String (%root.lib.Display)*, %root.lib.String (%root.lib.String, %root.lib.String)* }>
%root.lib.Display = type <{ i8*, %root.lib.Display_interface* }>
%root.lib.Display_interface = type <{ %root.lib.String (%root.lib.Display)* }>
%root.lib.IO_static = type <{ void (%root.lib.String)*, void (%root.lib.String)* }>
%root.lib.sockaddr_in_static = type <{ void (%root.lib.sockaddr_in, i16, i16, i32)* }>
%root.lib.sockaddr_in = type <{ %root.lib.sockaddr_in_object*, %root.lib.sockaddr_in_static* }>
%root.lib.sockaddr_in_object = type <{ i16, i16, i32, i64 }>
%root.lib.ErrnoException_static = type <{ void (%root.lib.ErrnoException, %root.lib.String)* }>
%root.lib.ErrnoException = type <{ %root.lib.ErrnoException_object*, %root.lib.ErrnoException_static* }>
%root.lib.ErrnoException_object = type <{ %root.lib.String }>
%root.lib.InetSocket_static = type <{ void (%root.lib.InetSocket, i32)*, i32 (%root.lib.InetSocket)*, void (%root.lib.InetSocket, i32, %root.lib.SocketServer)*, void (%root.lib.InetSocket, i16, i32)* }>
%root.lib.InetSocket = type <{ %root.lib.InetSocket_object*, %root.lib.InetSocket_static* }>
%root.lib.InetSocket_object = type <{ %root.lib.S7Pointer1E11sockaddr_in, i32 }>
%root.lib.S7Pointer1E11sockaddr_in = type <{ %root.lib.S7Pointer1E11sockaddr_in_object*, %root.lib.S7Pointer1E11sockaddr_in_static* }>
%root.lib.S7Pointer1E11sockaddr_in_object = type <{ %root.lib.sockaddr_in* }>
%root.lib.S7Pointer1E11sockaddr_in_static = type <{ void (%root.lib.S7Pointer1E11sockaddr_in, %root.lib.sockaddr_in)*, i32 (%root.lib.S7Pointer1E11sockaddr_in)*, %root.lib.sockaddr_in* (%root.lib.S7Pointer1E11sockaddr_in)*, %root.lib.sockaddr_in (%root.lib.S7Pointer1E11sockaddr_in)*, i8* (%root.lib.S7Pointer1E11sockaddr_in)* }>
%root.lib.SocketServer = type <{ i8*, %root.lib.SocketServer_interface* }>
%root.lib.SocketServer_interface = type <{ void (%root.lib.SocketServer, i32)* }>
%root.lib.S7Pointer1E3i32_static = type <{ void (%root.lib.S7Pointer1E3i32, i32)*, i32 (%root.lib.S7Pointer1E3i32)*, i32* (%root.lib.S7Pointer1E3i32)*, i32 (%root.lib.S7Pointer1E3i32)*, i8* (%root.lib.S7Pointer1E3i32)* }>
%root.lib.S7Pointer1E3i32 = type <{ %root.lib.S7Pointer1E3i32_object*, %root.lib.S7Pointer1E3i32_static* }>
%root.lib.S7Pointer1E3i32_object = type <{ i32* }>
%root.lib.S3Vec1E6String_static = type <{ void (%root.lib.S3Vec1E6String, %root.lib.String)*, %root.lib.String (%root.lib.S3Vec1E6String, i64)*, void (%root.lib.S3Vec1E6String)*, void (%root.lib.S3Vec1E6String, i64, %root.lib.String)*, %root.lib.String (%root.lib.S3Vec1E6String)* }>
%root.lib.S3Vec1E6String = type <{ %root.lib.S3Vec1E6String_object*, %root.lib.S3Vec1E6String_static* }>
%root.lib.S3Vec1E6String_object = type <{ %root.lib.String*, i64, i64 }>
%root.lib.IO = type <{ %root.lib.IO_object*, %root.lib.IO_static* }>
%root.lib.IO_object = type <{}>

@root.lib.Exception_static = global %root.lib.Exception_static <{ void (%root.lib.Exception, %root.lib.String)* @root.lib.Exception._Z11constructor1E6String }>
@root.lib.IO_static = global %root.lib.IO_static <{ void (%root.lib.String)* @root.lib.IO._Z7println1E6String, void (%root.lib.String)* @root.lib.IO._Z5print1E6String }>
@root.lib.String_static = global %root.lib.String_static <{ %root.lib.String (%root.lib.String, i64)* @root.lib.String._Z7__add__1E3i64, %root.lib.String (%root.lib.String, %root.lib.Display)* @root.lib.String._Z7__add__1E7Display, %root.lib.String (i8*, i64)* @root.lib.String._Z9fromBytes2ER2u83i64, void (%root.lib.String)* @root.lib.String._Z11constructor0E, %root.lib.String (%root.lib.String)* @root.lib.String._Z4from1E6String, %root.lib.String (i64)* @root.lib.String._Z4from1E3i64, %root.lib.String (%root.lib.Display)* @root.lib.String._Z4from1E7Display, %root.lib.String (%root.lib.String, %root.lib.String)* @root.lib.String._Z7__add__1E6String }>
@root.lib.sockaddr_in_static = global %root.lib.sockaddr_in_static <{ void (%root.lib.sockaddr_in, i16, i16, i32)* @root.lib.sockaddr_in._Z11constructor3E3u163u163u32 }>
@root.lib.ErrnoException_static = global %root.lib.ErrnoException_static <{ void (%root.lib.ErrnoException, %root.lib.String)* @root.lib.ErrnoException._Z11constructor1E6String }>
@root.lib.InetSocket_static = global %root.lib.InetSocket_static <{ void (%root.lib.InetSocket, i32)* @root.lib.InetSocket._Z6listen1E3i32, i32 (%root.lib.InetSocket)* @root.lib.InetSocket._Z6accept0E, void (%root.lib.InetSocket, i32, %root.lib.SocketServer)* @root.lib.InetSocket._Z5serve2E3i3212SocketServer, void (%root.lib.InetSocket, i16, i32)* @root.lib.InetSocket._Z11constructor2E3u163u32 }>
@root.lib.S7Pointer1E11sockaddr_in_static = global %root.lib.S7Pointer1E11sockaddr_in_static <{ void (%root.lib.S7Pointer1E11sockaddr_in, %root.lib.sockaddr_in)* @root.lib.S7Pointer1E11sockaddr_in._Z11constructor2E4Self1T, i32 (%root.lib.S7Pointer1E11sockaddr_in)* @root.lib.S7Pointer1E11sockaddr_in._Z4size1E4Self, %root.lib.sockaddr_in* (%root.lib.S7Pointer1E11sockaddr_in)* @root.lib.S7Pointer1E11sockaddr_in._Z13value_pointer1E4Self, %root.lib.sockaddr_in (%root.lib.S7Pointer1E11sockaddr_in)* @root.lib.S7Pointer1E11sockaddr_in._Z11dereference1E4Self, i8* (%root.lib.S7Pointer1E11sockaddr_in)* @root.lib.S7Pointer1E11sockaddr_in._Z17structure_pointer1E4Self }>
@root.lib.S7Pointer1E3i32_static = global %root.lib.S7Pointer1E3i32_static <{ void (%root.lib.S7Pointer1E3i32, i32)* @root.lib.S7Pointer1E3i32._Z11constructor2E4Self1T, i32 (%root.lib.S7Pointer1E3i32)* @root.lib.S7Pointer1E3i32._Z4size1E4Self, i32* (%root.lib.S7Pointer1E3i32)* @root.lib.S7Pointer1E3i32._Z13value_pointer1E4Self, i32 (%root.lib.S7Pointer1E3i32)* @root.lib.S7Pointer1E3i32._Z11dereference1E4Self, i8* (%root.lib.S7Pointer1E3i32)* @root.lib.S7Pointer1E3i32._Z17structure_pointer1E4Self }>
@root.lib.S3Vec1E2u8_static = global %root.lib.S3Vec1E2u8_static <{ void (%root.lib.S3Vec1E2u8, i8)* @root.lib.S3Vec1E2u8._Z4push2E4Self1T, i8 (%root.lib.S3Vec1E2u8, i64)* @root.lib.S3Vec1E2u8._Z9__index__2E4Self3i64, void (%root.lib.S3Vec1E2u8)* @root.lib.S3Vec1E2u8._Z11constructor1E4Self, void (%root.lib.S3Vec1E2u8, i64, i8)* @root.lib.S3Vec1E2u8._Z9__index__3E4Self3i641T, i8 (%root.lib.S3Vec1E2u8)* @root.lib.S3Vec1E2u8._Z3pop1E4Self }>
@root.lib.S3Vec1E6String_static = global %root.lib.S3Vec1E6String_static <{ void (%root.lib.S3Vec1E6String, %root.lib.String)* @root.lib.S3Vec1E6String._Z4push2E4Self1T, %root.lib.String (%root.lib.S3Vec1E6String, i64)* @root.lib.S3Vec1E6String._Z9__index__2E4Self3i64, void (%root.lib.S3Vec1E6String)* @root.lib.S3Vec1E6String._Z11constructor1E4Self, void (%root.lib.S3Vec1E6String, i64, %root.lib.String)* @root.lib.S3Vec1E6String._Z9__index__3E4Self3i641T, %root.lib.String (%root.lib.S3Vec1E6String)* @root.lib.S3Vec1E6String._Z3pop1E4Self }>

declare i64 @write(i32, i8*, i64)

declare i64 @read(i32, i8*, i64)

declare i32 @close(i32)

declare void @free(i8*)

declare i8* @strerror(i32)

declare i32 @__get_errno()

declare i32 @accept(i32, i8*, i32*)

declare i8* @malloc(i64)

declare i64 @strlen(i8*)

declare %root.lib.Exception @root.lib.Exception_alloc(%root.lib.String)

declare %root.lib.IO @root.lib.IO_alloc()

declare %root.lib.sockaddr_in @root.lib.sockaddr_in_alloc(i16, i16, i32)

declare %root.lib.ErrnoException @root.lib.ErrnoException_alloc(%root.lib.String)

declare %root.lib.InetSocket @root.lib.InetSocket_alloc(i16, i32)

declare %root.lib.String @root.lib.String_alloc()

declare %root.lib.S7Pointer1E11sockaddr_in @root.lib.S7Pointer1E11sockaddr_in_alloc(%root.lib.sockaddr_in)

declare %root.lib.S7Pointer1E3i32 @root.lib.S7Pointer1E3i32_alloc(i32)

declare %root.lib.S3Vec1E2u8 @root.lib.S3Vec1E2u8_alloc()

declare %root.lib.S3Vec1E6String @root.lib.S3Vec1E6String_alloc()

define void @root.lib.Exception._Z11constructor1E6String(%root.lib.Exception %0, %root.lib.String %1) {
entry:
  ret void
}

define void @root.lib.IO._Z7println1E6String(%root.lib.String %0) {
entry:
  %1 = load void (%root.lib.String)*, void (%root.lib.String)** getelementptr inbounds (%root.lib.IO_static, %root.lib.IO_static* @root.lib.IO_static, i32 0, i32 1), align 8
  call void %1(%root.lib.String %0)
  %2 = load void (%root.lib.String)*, void (%root.lib.String)** getelementptr inbounds (%root.lib.IO_static, %root.lib.IO_static* @root.lib.IO_static, i32 0, i32 1), align 8
  %3 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %4 = alloca [5 x i8], align 1
  store [5 x i8] c"\22\\n\22\00", [5 x i8]* %4, align 1
  %5 = bitcast [5 x i8]* %4 to i8*
  %6 = alloca [5 x i8], align 1
  store [5 x i8] c"\22\\n\22\00", [5 x i8]* %6, align 1
  %7 = bitcast [5 x i8]* %6 to i8*
  %8 = call i64 @strlen(i8* %7)
  %9 = call %root.lib.String %3(i8* %5, i64 %8)
  call void %2(%root.lib.String %9)
  ret void
}

define void @root.lib.IO._Z5print1E6String(%root.lib.String %0) {
entry:
  %fd = alloca i32, align 4
  store i32 1, i32* %fd, align 4
  %1 = load i32, i32* %fd, align 4
  %2 = alloca %root.lib.S3Vec1E2u8, align 8
  %3 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %3, align 1
  %4 = getelementptr inbounds %root.lib.String, %root.lib.String* %3, i32 0, i32 0
  %5 = load %root.lib.String_object*, %root.lib.String_object** %4, align 8
  %6 = getelementptr inbounds %root.lib.String_object, %root.lib.String_object* %5, i32 0, i32 0
  %7 = load %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %6, align 1
  store %root.lib.S3Vec1E2u8 %7, %root.lib.S3Vec1E2u8* %2, align 1
  %8 = getelementptr inbounds %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %2, i32 0, i32 0
  %9 = load %root.lib.S3Vec1E2u8_object*, %root.lib.S3Vec1E2u8_object** %8, align 8
  %10 = getelementptr inbounds %root.lib.S3Vec1E2u8_object, %root.lib.S3Vec1E2u8_object* %9, i32 0, i32 0
  %11 = load i8*, i8** %10, align 8
  %12 = alloca %root.lib.S3Vec1E2u8, align 8
  %13 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %13, align 1
  %14 = getelementptr inbounds %root.lib.String, %root.lib.String* %13, i32 0, i32 0
  %15 = load %root.lib.String_object*, %root.lib.String_object** %14, align 8
  %16 = getelementptr inbounds %root.lib.String_object, %root.lib.String_object* %15, i32 0, i32 0
  %17 = load %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %16, align 1
  store %root.lib.S3Vec1E2u8 %17, %root.lib.S3Vec1E2u8* %12, align 1
  %18 = getelementptr inbounds %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %12, i32 0, i32 0
  %19 = load %root.lib.S3Vec1E2u8_object*, %root.lib.S3Vec1E2u8_object** %18, align 8
  %20 = getelementptr inbounds %root.lib.S3Vec1E2u8_object, %root.lib.S3Vec1E2u8_object* %19, i32 0, i32 1
  %21 = load i64, i64* %20, align 4
  %22 = call i64 @write(i32 %1, i8* %11, i64 %21)
  ret void
}

define void @root.lib.sockaddr_in._Z11constructor3E3u163u163u32(%root.lib.sockaddr_in %0, i16 %1, i16 %2, i32 %3) {
entry:
  ret void
}

define void @root.lib.ErrnoException._Z11constructor1E6String(%root.lib.ErrnoException %0, %root.lib.String %1) {
entry:
  %raw_error = alloca i8*, align 8
  %2 = call i32 @__get_errno()
  %3 = call i8* @strerror(i32 %2)
  store i8* %3, i8** %raw_error, align 8
  ret void
}

define void @root.lib.InetSocket._Z6listen1E3i32(%root.lib.InetSocket %0, i32 %1) {
entry:
  ret void
}

define i32 @root.lib.InetSocket._Z6accept0E(%root.lib.InetSocket %0) {
entry:
  %clientaddr = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  %1 = call %root.lib.sockaddr_in @root.lib.sockaddr_in_alloc(i16 0, i16 0, i32 0)
  %2 = call %root.lib.S7Pointer1E11sockaddr_in @root.lib.S7Pointer1E11sockaddr_in_alloc(%root.lib.sockaddr_in %1)
  store %root.lib.S7Pointer1E11sockaddr_in %2, %root.lib.S7Pointer1E11sockaddr_in* %clientaddr, align 1
  %clientlen = alloca %root.lib.S7Pointer1E3i32, align 8
  %3 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  %temp_6 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  %4 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %clientaddr, align 1
  store %root.lib.S7Pointer1E11sockaddr_in %4, %root.lib.S7Pointer1E11sockaddr_in* %temp_6, align 1
  %5 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %temp_6, align 1
  store %root.lib.S7Pointer1E11sockaddr_in %5, %root.lib.S7Pointer1E11sockaddr_in* %3, align 1
  %6 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %3, i32 0, i32 1
  %7 = load %root.lib.S7Pointer1E11sockaddr_in_static*, %root.lib.S7Pointer1E11sockaddr_in_static** %6, align 8
  %8 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in_static, %root.lib.S7Pointer1E11sockaddr_in_static* %7, i32 0, i32 1
  %9 = load i32 (%root.lib.S7Pointer1E11sockaddr_in)*, i32 (%root.lib.S7Pointer1E11sockaddr_in)** %8, align 8
  %temp_61 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  %10 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %clientaddr, align 1
  store %root.lib.S7Pointer1E11sockaddr_in %10, %root.lib.S7Pointer1E11sockaddr_in* %temp_61, align 1
  %11 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %temp_61, align 1
  %12 = call i32 %9(%root.lib.S7Pointer1E11sockaddr_in %11)
  %13 = call %root.lib.S7Pointer1E3i32 @root.lib.S7Pointer1E3i32_alloc(i32 %12)
  store %root.lib.S7Pointer1E3i32 %13, %root.lib.S7Pointer1E3i32* %clientlen, align 1
  %childfd = alloca i32, align 4
  %14 = alloca %root.lib.InetSocket, align 8
  store %root.lib.InetSocket %0, %root.lib.InetSocket* %14, align 1
  %15 = getelementptr inbounds %root.lib.InetSocket, %root.lib.InetSocket* %14, i32 0, i32 0
  %16 = load %root.lib.InetSocket_object*, %root.lib.InetSocket_object** %15, align 8
  %17 = getelementptr inbounds %root.lib.InetSocket_object, %root.lib.InetSocket_object* %16, i32 0, i32 1
  %18 = load i32, i32* %17, align 4
  %19 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  %temp_7 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  %20 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %clientaddr, align 1
  store %root.lib.S7Pointer1E11sockaddr_in %20, %root.lib.S7Pointer1E11sockaddr_in* %temp_7, align 1
  %21 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %temp_7, align 1
  store %root.lib.S7Pointer1E11sockaddr_in %21, %root.lib.S7Pointer1E11sockaddr_in* %19, align 1
  %22 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %19, i32 0, i32 1
  %23 = load %root.lib.S7Pointer1E11sockaddr_in_static*, %root.lib.S7Pointer1E11sockaddr_in_static** %22, align 8
  %24 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in_static, %root.lib.S7Pointer1E11sockaddr_in_static* %23, i32 0, i32 4
  %25 = load i8* (%root.lib.S7Pointer1E11sockaddr_in)*, i8* (%root.lib.S7Pointer1E11sockaddr_in)** %24, align 8
  %temp_72 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  %26 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %clientaddr, align 1
  store %root.lib.S7Pointer1E11sockaddr_in %26, %root.lib.S7Pointer1E11sockaddr_in* %temp_72, align 1
  %27 = load %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %temp_72, align 1
  %28 = call i8* %25(%root.lib.S7Pointer1E11sockaddr_in %27)
  %29 = alloca %root.lib.S7Pointer1E3i32, align 8
  %temp_8 = alloca %root.lib.S7Pointer1E3i32, align 8
  %30 = load %root.lib.S7Pointer1E3i32, %root.lib.S7Pointer1E3i32* %clientlen, align 1
  store %root.lib.S7Pointer1E3i32 %30, %root.lib.S7Pointer1E3i32* %temp_8, align 1
  %31 = load %root.lib.S7Pointer1E3i32, %root.lib.S7Pointer1E3i32* %temp_8, align 1
  store %root.lib.S7Pointer1E3i32 %31, %root.lib.S7Pointer1E3i32* %29, align 1
  %32 = getelementptr inbounds %root.lib.S7Pointer1E3i32, %root.lib.S7Pointer1E3i32* %29, i32 0, i32 1
  %33 = load %root.lib.S7Pointer1E3i32_static*, %root.lib.S7Pointer1E3i32_static** %32, align 8
  %34 = getelementptr inbounds %root.lib.S7Pointer1E3i32_static, %root.lib.S7Pointer1E3i32_static* %33, i32 0, i32 2
  %35 = load i32* (%root.lib.S7Pointer1E3i32)*, i32* (%root.lib.S7Pointer1E3i32)** %34, align 8
  %temp_83 = alloca %root.lib.S7Pointer1E3i32, align 8
  %36 = load %root.lib.S7Pointer1E3i32, %root.lib.S7Pointer1E3i32* %clientlen, align 1
  store %root.lib.S7Pointer1E3i32 %36, %root.lib.S7Pointer1E3i32* %temp_83, align 1
  %37 = load %root.lib.S7Pointer1E3i32, %root.lib.S7Pointer1E3i32* %temp_83, align 1
  %38 = call i32* %35(%root.lib.S7Pointer1E3i32 %37)
  %39 = call i32 @accept(i32 %18, i8* %28, i32* %38)
  store i32 %39, i32* %childfd, align 4
  %40 = load i32, i32* %childfd, align 4
  ret i32 %40
}

define void @root.lib.InetSocket._Z5serve2E3i3212SocketServer(%root.lib.InetSocket %0, i32 %1, %root.lib.SocketServer %2) {
entry:
  %3 = alloca %root.lib.InetSocket, align 8
  %temp_9 = alloca %root.lib.InetSocket, align 8
  store %root.lib.InetSocket %0, %root.lib.InetSocket* %temp_9, align 1
  %4 = load %root.lib.InetSocket, %root.lib.InetSocket* %temp_9, align 1
  store %root.lib.InetSocket %4, %root.lib.InetSocket* %3, align 1
  %5 = getelementptr inbounds %root.lib.InetSocket, %root.lib.InetSocket* %3, i32 0, i32 1
  %6 = load %root.lib.InetSocket_static*, %root.lib.InetSocket_static** %5, align 8
  %7 = getelementptr inbounds %root.lib.InetSocket_static, %root.lib.InetSocket_static* %6, i32 0, i32 0
  %8 = load void (%root.lib.InetSocket, i32)*, void (%root.lib.InetSocket, i32)** %7, align 8
  %temp_91 = alloca %root.lib.InetSocket, align 8
  store %root.lib.InetSocket %0, %root.lib.InetSocket* %temp_91, align 1
  %9 = load %root.lib.InetSocket, %root.lib.InetSocket* %temp_91, align 1
  call void %8(%root.lib.InetSocket %9, i32 %1)
  ret void
}

define void @root.lib.InetSocket._Z11constructor2E3u163u32(%root.lib.InetSocket %0, i16 %1, i32 %2) {
entry:
  %c_AF_INET = alloca i32, align 4
  store i32 2, i32* %c_AF_INET, align 4
  %c_SOCK_STREAM = alloca i32, align 4
  store i32 1, i32* %c_SOCK_STREAM, align 4
  ret void
}

define %root.lib.String @root.lib.String._Z7__add__1E3i64(%root.lib.String %0, i64 %1) {
entry:
  %2 = alloca %root.lib.String, align 8
  %temp_14 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %temp_14, align 1
  %3 = load %root.lib.String, %root.lib.String* %temp_14, align 1
  store %root.lib.String %3, %root.lib.String* %2, align 1
  %4 = getelementptr inbounds %root.lib.String, %root.lib.String* %2, i32 0, i32 1
  %5 = load %root.lib.String_static*, %root.lib.String_static** %4, align 8
  %6 = getelementptr inbounds %root.lib.String_static, %root.lib.String_static* %5, i32 0, i32 7
  %7 = load %root.lib.String (%root.lib.String, %root.lib.String)*, %root.lib.String (%root.lib.String, %root.lib.String)** %6, align 8
  %temp_141 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %temp_141, align 1
  %8 = load %root.lib.String, %root.lib.String* %temp_141, align 1
  %9 = load %root.lib.String (i64)*, %root.lib.String (i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 5), align 8
  %10 = call %root.lib.String %9(i64 %1)
  %11 = call %root.lib.String %7(%root.lib.String %8, %root.lib.String %10)
  ret %root.lib.String %11
}

define %root.lib.String @root.lib.String._Z7__add__1E7Display(%root.lib.String %0, %root.lib.Display %1) {
entry:
  %2 = alloca %root.lib.String, align 8
  %temp_16 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %temp_16, align 1
  %3 = load %root.lib.String, %root.lib.String* %temp_16, align 1
  store %root.lib.String %3, %root.lib.String* %2, align 1
  %4 = getelementptr inbounds %root.lib.String, %root.lib.String* %2, i32 0, i32 1
  %5 = load %root.lib.String_static*, %root.lib.String_static** %4, align 8
  %6 = getelementptr inbounds %root.lib.String_static, %root.lib.String_static* %5, i32 0, i32 7
  %7 = load %root.lib.String (%root.lib.String, %root.lib.String)*, %root.lib.String (%root.lib.String, %root.lib.String)** %6, align 8
  %temp_161 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %temp_161, align 1
  %8 = load %root.lib.String, %root.lib.String* %temp_161, align 1
  %9 = alloca %root.lib.Display, align 8
  %temp_15 = alloca %root.lib.Display, align 8
  store %root.lib.Display %1, %root.lib.Display* %temp_15, align 1
  %10 = load %root.lib.Display, %root.lib.Display* %temp_15, align 1
  store %root.lib.Display %10, %root.lib.Display* %9, align 1
  %11 = getelementptr inbounds %root.lib.Display, %root.lib.Display* %9, i32 0, i32 1
  %12 = load %root.lib.Display_interface*, %root.lib.Display_interface** %11, align 8
  %13 = getelementptr inbounds %root.lib.Display_interface, %root.lib.Display_interface* %12, i32 0, i32 0
  %14 = load %root.lib.String (%root.lib.Display)*, %root.lib.String (%root.lib.Display)** %13, align 8
  %temp_152 = alloca %root.lib.Display, align 8
  store %root.lib.Display %1, %root.lib.Display* %temp_152, align 1
  %15 = load %root.lib.Display, %root.lib.Display* %temp_152, align 1
  %16 = call %root.lib.String %14(%root.lib.Display %15)
  %17 = call %root.lib.String %7(%root.lib.String %8, %root.lib.String %16)
  ret %root.lib.String %17
}

define %root.lib.String @root.lib.String._Z9fromBytes2ER2u83i64(i8* %0, i64 %1) {
entry:
  %rc = alloca %root.lib.String, align 8
  %2 = call %root.lib.String @root.lib.String_alloc()
  store %root.lib.String %2, %root.lib.String* %rc, align 1
  %i = alloca i64, align 8
  store i64 0, i64* %i, align 4
  %3 = load %root.lib.String, %root.lib.String* %rc, align 1
  ret %root.lib.String %3
}

define void @root.lib.String._Z11constructor0E(%root.lib.String %0) {
entry:
  ret void
}

define %root.lib.String @root.lib.String._Z4from1E6String(%root.lib.String %0) {
entry:
  %1 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %2 = alloca %root.lib.S3Vec1E2u8, align 8
  %3 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %3, align 1
  %4 = getelementptr inbounds %root.lib.String, %root.lib.String* %3, i32 0, i32 0
  %5 = load %root.lib.String_object*, %root.lib.String_object** %4, align 8
  %6 = getelementptr inbounds %root.lib.String_object, %root.lib.String_object* %5, i32 0, i32 0
  %7 = load %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %6, align 1
  store %root.lib.S3Vec1E2u8 %7, %root.lib.S3Vec1E2u8* %2, align 1
  %8 = getelementptr inbounds %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %2, i32 0, i32 0
  %9 = load %root.lib.S3Vec1E2u8_object*, %root.lib.S3Vec1E2u8_object** %8, align 8
  %10 = getelementptr inbounds %root.lib.S3Vec1E2u8_object, %root.lib.S3Vec1E2u8_object* %9, i32 0, i32 0
  %11 = load i8*, i8** %10, align 8
  %12 = alloca %root.lib.S3Vec1E2u8, align 8
  %13 = alloca %root.lib.String, align 8
  store %root.lib.String %0, %root.lib.String* %13, align 1
  %14 = getelementptr inbounds %root.lib.String, %root.lib.String* %13, i32 0, i32 0
  %15 = load %root.lib.String_object*, %root.lib.String_object** %14, align 8
  %16 = getelementptr inbounds %root.lib.String_object, %root.lib.String_object* %15, i32 0, i32 0
  %17 = load %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %16, align 1
  store %root.lib.S3Vec1E2u8 %17, %root.lib.S3Vec1E2u8* %12, align 1
  %18 = getelementptr inbounds %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %12, i32 0, i32 0
  %19 = load %root.lib.S3Vec1E2u8_object*, %root.lib.S3Vec1E2u8_object** %18, align 8
  %20 = getelementptr inbounds %root.lib.S3Vec1E2u8_object, %root.lib.S3Vec1E2u8_object* %19, i32 0, i32 1
  %21 = load i64, i64* %20, align 4
  %22 = call %root.lib.String %1(i8* %11, i64 %21)
  ret %root.lib.String %22
}

define %root.lib.String @root.lib.String._Z4from1E3i64(i64 %0) {
entry:
  %digits = alloca %root.lib.S3Vec1E6String, align 8
  %1 = call %root.lib.S3Vec1E6String @root.lib.S3Vec1E6String_alloc()
  store %root.lib.S3Vec1E6String %1, %root.lib.S3Vec1E6String* %digits, align 1
  %2 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_18 = alloca %root.lib.S3Vec1E6String, align 8
  %3 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %3, %root.lib.S3Vec1E6String* %temp_18, align 1
  %4 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_18, align 1
  store %root.lib.S3Vec1E6String %4, %root.lib.S3Vec1E6String* %2, align 1
  %5 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %2, i32 0, i32 1
  %6 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %5, align 8
  %7 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %6, i32 0, i32 0
  %8 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %7, align 8
  %temp_181 = alloca %root.lib.S3Vec1E6String, align 8
  %9 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %9, %root.lib.S3Vec1E6String* %temp_181, align 1
  %10 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_181, align 1
  %11 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %12 = alloca [4 x i8], align 1
  store [4 x i8] c"\220\22\00", [4 x i8]* %12, align 1
  %13 = bitcast [4 x i8]* %12 to i8*
  %14 = alloca [4 x i8], align 1
  store [4 x i8] c"\220\22\00", [4 x i8]* %14, align 1
  %15 = bitcast [4 x i8]* %14 to i8*
  %16 = call i64 @strlen(i8* %15)
  %17 = call %root.lib.String %11(i8* %13, i64 %16)
  call void %8(%root.lib.S3Vec1E6String %10, %root.lib.String %17)
  %18 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_19 = alloca %root.lib.S3Vec1E6String, align 8
  %19 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %19, %root.lib.S3Vec1E6String* %temp_19, align 1
  %20 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_19, align 1
  store %root.lib.S3Vec1E6String %20, %root.lib.S3Vec1E6String* %18, align 1
  %21 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %18, i32 0, i32 1
  %22 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %21, align 8
  %23 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %22, i32 0, i32 0
  %24 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %23, align 8
  %temp_192 = alloca %root.lib.S3Vec1E6String, align 8
  %25 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %25, %root.lib.S3Vec1E6String* %temp_192, align 1
  %26 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_192, align 1
  %27 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %28 = alloca [4 x i8], align 1
  store [4 x i8] c"\221\22\00", [4 x i8]* %28, align 1
  %29 = bitcast [4 x i8]* %28 to i8*
  %30 = alloca [4 x i8], align 1
  store [4 x i8] c"\221\22\00", [4 x i8]* %30, align 1
  %31 = bitcast [4 x i8]* %30 to i8*
  %32 = call i64 @strlen(i8* %31)
  %33 = call %root.lib.String %27(i8* %29, i64 %32)
  call void %24(%root.lib.S3Vec1E6String %26, %root.lib.String %33)
  %34 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_20 = alloca %root.lib.S3Vec1E6String, align 8
  %35 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %35, %root.lib.S3Vec1E6String* %temp_20, align 1
  %36 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_20, align 1
  store %root.lib.S3Vec1E6String %36, %root.lib.S3Vec1E6String* %34, align 1
  %37 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %34, i32 0, i32 1
  %38 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %37, align 8
  %39 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %38, i32 0, i32 0
  %40 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %39, align 8
  %temp_203 = alloca %root.lib.S3Vec1E6String, align 8
  %41 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %41, %root.lib.S3Vec1E6String* %temp_203, align 1
  %42 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_203, align 1
  %43 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %44 = alloca [4 x i8], align 1
  store [4 x i8] c"\222\22\00", [4 x i8]* %44, align 1
  %45 = bitcast [4 x i8]* %44 to i8*
  %46 = alloca [4 x i8], align 1
  store [4 x i8] c"\222\22\00", [4 x i8]* %46, align 1
  %47 = bitcast [4 x i8]* %46 to i8*
  %48 = call i64 @strlen(i8* %47)
  %49 = call %root.lib.String %43(i8* %45, i64 %48)
  call void %40(%root.lib.S3Vec1E6String %42, %root.lib.String %49)
  %50 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_21 = alloca %root.lib.S3Vec1E6String, align 8
  %51 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %51, %root.lib.S3Vec1E6String* %temp_21, align 1
  %52 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_21, align 1
  store %root.lib.S3Vec1E6String %52, %root.lib.S3Vec1E6String* %50, align 1
  %53 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %50, i32 0, i32 1
  %54 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %53, align 8
  %55 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %54, i32 0, i32 0
  %56 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %55, align 8
  %temp_214 = alloca %root.lib.S3Vec1E6String, align 8
  %57 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %57, %root.lib.S3Vec1E6String* %temp_214, align 1
  %58 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_214, align 1
  %59 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %60 = alloca [4 x i8], align 1
  store [4 x i8] c"\223\22\00", [4 x i8]* %60, align 1
  %61 = bitcast [4 x i8]* %60 to i8*
  %62 = alloca [4 x i8], align 1
  store [4 x i8] c"\223\22\00", [4 x i8]* %62, align 1
  %63 = bitcast [4 x i8]* %62 to i8*
  %64 = call i64 @strlen(i8* %63)
  %65 = call %root.lib.String %59(i8* %61, i64 %64)
  call void %56(%root.lib.S3Vec1E6String %58, %root.lib.String %65)
  %66 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_22 = alloca %root.lib.S3Vec1E6String, align 8
  %67 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %67, %root.lib.S3Vec1E6String* %temp_22, align 1
  %68 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_22, align 1
  store %root.lib.S3Vec1E6String %68, %root.lib.S3Vec1E6String* %66, align 1
  %69 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %66, i32 0, i32 1
  %70 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %69, align 8
  %71 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %70, i32 0, i32 0
  %72 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %71, align 8
  %temp_225 = alloca %root.lib.S3Vec1E6String, align 8
  %73 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %73, %root.lib.S3Vec1E6String* %temp_225, align 1
  %74 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_225, align 1
  %75 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %76 = alloca [4 x i8], align 1
  store [4 x i8] c"\224\22\00", [4 x i8]* %76, align 1
  %77 = bitcast [4 x i8]* %76 to i8*
  %78 = alloca [4 x i8], align 1
  store [4 x i8] c"\224\22\00", [4 x i8]* %78, align 1
  %79 = bitcast [4 x i8]* %78 to i8*
  %80 = call i64 @strlen(i8* %79)
  %81 = call %root.lib.String %75(i8* %77, i64 %80)
  call void %72(%root.lib.S3Vec1E6String %74, %root.lib.String %81)
  %82 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_23 = alloca %root.lib.S3Vec1E6String, align 8
  %83 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %83, %root.lib.S3Vec1E6String* %temp_23, align 1
  %84 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_23, align 1
  store %root.lib.S3Vec1E6String %84, %root.lib.S3Vec1E6String* %82, align 1
  %85 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %82, i32 0, i32 1
  %86 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %85, align 8
  %87 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %86, i32 0, i32 0
  %88 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %87, align 8
  %temp_236 = alloca %root.lib.S3Vec1E6String, align 8
  %89 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %89, %root.lib.S3Vec1E6String* %temp_236, align 1
  %90 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_236, align 1
  %91 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %92 = alloca [4 x i8], align 1
  store [4 x i8] c"\225\22\00", [4 x i8]* %92, align 1
  %93 = bitcast [4 x i8]* %92 to i8*
  %94 = alloca [4 x i8], align 1
  store [4 x i8] c"\225\22\00", [4 x i8]* %94, align 1
  %95 = bitcast [4 x i8]* %94 to i8*
  %96 = call i64 @strlen(i8* %95)
  %97 = call %root.lib.String %91(i8* %93, i64 %96)
  call void %88(%root.lib.S3Vec1E6String %90, %root.lib.String %97)
  %98 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_24 = alloca %root.lib.S3Vec1E6String, align 8
  %99 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %99, %root.lib.S3Vec1E6String* %temp_24, align 1
  %100 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_24, align 1
  store %root.lib.S3Vec1E6String %100, %root.lib.S3Vec1E6String* %98, align 1
  %101 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %98, i32 0, i32 1
  %102 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %101, align 8
  %103 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %102, i32 0, i32 0
  %104 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %103, align 8
  %temp_247 = alloca %root.lib.S3Vec1E6String, align 8
  %105 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %105, %root.lib.S3Vec1E6String* %temp_247, align 1
  %106 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_247, align 1
  %107 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %108 = alloca [4 x i8], align 1
  store [4 x i8] c"\226\22\00", [4 x i8]* %108, align 1
  %109 = bitcast [4 x i8]* %108 to i8*
  %110 = alloca [4 x i8], align 1
  store [4 x i8] c"\226\22\00", [4 x i8]* %110, align 1
  %111 = bitcast [4 x i8]* %110 to i8*
  %112 = call i64 @strlen(i8* %111)
  %113 = call %root.lib.String %107(i8* %109, i64 %112)
  call void %104(%root.lib.S3Vec1E6String %106, %root.lib.String %113)
  %114 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_25 = alloca %root.lib.S3Vec1E6String, align 8
  %115 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %115, %root.lib.S3Vec1E6String* %temp_25, align 1
  %116 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_25, align 1
  store %root.lib.S3Vec1E6String %116, %root.lib.S3Vec1E6String* %114, align 1
  %117 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %114, i32 0, i32 1
  %118 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %117, align 8
  %119 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %118, i32 0, i32 0
  %120 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %119, align 8
  %temp_258 = alloca %root.lib.S3Vec1E6String, align 8
  %121 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %121, %root.lib.S3Vec1E6String* %temp_258, align 1
  %122 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_258, align 1
  %123 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %124 = alloca [4 x i8], align 1
  store [4 x i8] c"\227\22\00", [4 x i8]* %124, align 1
  %125 = bitcast [4 x i8]* %124 to i8*
  %126 = alloca [4 x i8], align 1
  store [4 x i8] c"\227\22\00", [4 x i8]* %126, align 1
  %127 = bitcast [4 x i8]* %126 to i8*
  %128 = call i64 @strlen(i8* %127)
  %129 = call %root.lib.String %123(i8* %125, i64 %128)
  call void %120(%root.lib.S3Vec1E6String %122, %root.lib.String %129)
  %130 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_26 = alloca %root.lib.S3Vec1E6String, align 8
  %131 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %131, %root.lib.S3Vec1E6String* %temp_26, align 1
  %132 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_26, align 1
  store %root.lib.S3Vec1E6String %132, %root.lib.S3Vec1E6String* %130, align 1
  %133 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %130, i32 0, i32 1
  %134 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %133, align 8
  %135 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %134, i32 0, i32 0
  %136 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %135, align 8
  %temp_269 = alloca %root.lib.S3Vec1E6String, align 8
  %137 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %137, %root.lib.S3Vec1E6String* %temp_269, align 1
  %138 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_269, align 1
  %139 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %140 = alloca [4 x i8], align 1
  store [4 x i8] c"\228\22\00", [4 x i8]* %140, align 1
  %141 = bitcast [4 x i8]* %140 to i8*
  %142 = alloca [4 x i8], align 1
  store [4 x i8] c"\228\22\00", [4 x i8]* %142, align 1
  %143 = bitcast [4 x i8]* %142 to i8*
  %144 = call i64 @strlen(i8* %143)
  %145 = call %root.lib.String %139(i8* %141, i64 %144)
  call void %136(%root.lib.S3Vec1E6String %138, %root.lib.String %145)
  %146 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_27 = alloca %root.lib.S3Vec1E6String, align 8
  %147 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %147, %root.lib.S3Vec1E6String* %temp_27, align 1
  %148 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_27, align 1
  store %root.lib.S3Vec1E6String %148, %root.lib.S3Vec1E6String* %146, align 1
  %149 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %146, i32 0, i32 1
  %150 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %149, align 8
  %151 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %150, i32 0, i32 0
  %152 = load void (%root.lib.S3Vec1E6String, %root.lib.String)*, void (%root.lib.S3Vec1E6String, %root.lib.String)** %151, align 8
  %temp_2710 = alloca %root.lib.S3Vec1E6String, align 8
  %153 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %digits, align 1
  store %root.lib.S3Vec1E6String %153, %root.lib.S3Vec1E6String* %temp_2710, align 1
  %154 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_2710, align 1
  %155 = load %root.lib.String (i8*, i64)*, %root.lib.String (i8*, i64)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 2), align 8
  %156 = alloca [4 x i8], align 1
  store [4 x i8] c"\229\22\00", [4 x i8]* %156, align 1
  %157 = bitcast [4 x i8]* %156 to i8*
  %158 = alloca [4 x i8], align 1
  store [4 x i8] c"\229\22\00", [4 x i8]* %158, align 1
  %159 = bitcast [4 x i8]* %158 to i8*
  %160 = call i64 @strlen(i8* %159)
  %161 = call %root.lib.String %155(i8* %157, i64 %160)
  call void %152(%root.lib.S3Vec1E6String %154, %root.lib.String %161)
}

define %root.lib.String @root.lib.String._Z4from1E7Display(%root.lib.Display %0) {
entry:
  %1 = alloca %root.lib.Display, align 8
  %temp_30 = alloca %root.lib.Display, align 8
  store %root.lib.Display %0, %root.lib.Display* %temp_30, align 1
  %2 = load %root.lib.Display, %root.lib.Display* %temp_30, align 1
  store %root.lib.Display %2, %root.lib.Display* %1, align 1
  %3 = getelementptr inbounds %root.lib.Display, %root.lib.Display* %1, i32 0, i32 1
  %4 = load %root.lib.Display_interface*, %root.lib.Display_interface** %3, align 8
  %5 = getelementptr inbounds %root.lib.Display_interface, %root.lib.Display_interface* %4, i32 0, i32 0
  %6 = load %root.lib.String (%root.lib.Display)*, %root.lib.String (%root.lib.Display)** %5, align 8
  %temp_301 = alloca %root.lib.Display, align 8
  store %root.lib.Display %0, %root.lib.Display* %temp_301, align 1
  %7 = load %root.lib.Display, %root.lib.Display* %temp_301, align 1
  %8 = call %root.lib.String %6(%root.lib.Display %7)
  ret %root.lib.String %8
}

define %root.lib.String @root.lib.String._Z7__add__1E6String(%root.lib.String %0, %root.lib.String %1) {
entry:
  %rc = alloca %root.lib.String, align 8
  %2 = load %root.lib.String (%root.lib.String)*, %root.lib.String (%root.lib.String)** getelementptr inbounds (%root.lib.String_static, %root.lib.String_static* @root.lib.String_static, i32 0, i32 4), align 8
  %3 = call %root.lib.String %2(%root.lib.String %0)
  store %root.lib.String %3, %root.lib.String* %rc, align 1
  %i = alloca i64, align 8
  store i64 0, i64* %i, align 4
  %4 = load %root.lib.String, %root.lib.String* %rc, align 1
  ret %root.lib.String %4
}

define void @root.lib.S7Pointer1E11sockaddr_in._Z11constructor2E4Self1T(%root.lib.S7Pointer1E11sockaddr_in %0, %root.lib.sockaddr_in %1) {
entry:
  ret void
}

define i32 @root.lib.S7Pointer1E11sockaddr_in._Z4size1E4Self(%root.lib.S7Pointer1E11sockaddr_in %0) {
entry:
  ret i32 ptrtoint (%root.lib.sockaddr_in* getelementptr (%root.lib.sockaddr_in, %root.lib.sockaddr_in* null, i32 1) to i32)
}

define %root.lib.sockaddr_in* @root.lib.S7Pointer1E11sockaddr_in._Z13value_pointer1E4Self(%root.lib.S7Pointer1E11sockaddr_in %0) {
entry:
  %1 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  store %root.lib.S7Pointer1E11sockaddr_in %0, %root.lib.S7Pointer1E11sockaddr_in* %1, align 1
  %2 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %1, i32 0, i32 0
  %3 = load %root.lib.S7Pointer1E11sockaddr_in_object*, %root.lib.S7Pointer1E11sockaddr_in_object** %2, align 8
  %4 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in_object, %root.lib.S7Pointer1E11sockaddr_in_object* %3, i32 0, i32 0
  %5 = load %root.lib.sockaddr_in*, %root.lib.sockaddr_in** %4, align 8
  ret %root.lib.sockaddr_in* %5
}

define %root.lib.sockaddr_in @root.lib.S7Pointer1E11sockaddr_in._Z11dereference1E4Self(%root.lib.S7Pointer1E11sockaddr_in %0) {
entry:
  ret i1 undef
}

define i8* @root.lib.S7Pointer1E11sockaddr_in._Z17structure_pointer1E4Self(%root.lib.S7Pointer1E11sockaddr_in %0) {
entry:
  %1 = alloca %root.lib.S7Pointer1E11sockaddr_in, align 8
  store %root.lib.S7Pointer1E11sockaddr_in %0, %root.lib.S7Pointer1E11sockaddr_in* %1, align 1
  %2 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in, %root.lib.S7Pointer1E11sockaddr_in* %1, i32 0, i32 0
  %3 = load %root.lib.S7Pointer1E11sockaddr_in_object*, %root.lib.S7Pointer1E11sockaddr_in_object** %2, align 8
  %4 = getelementptr inbounds %root.lib.S7Pointer1E11sockaddr_in_object, %root.lib.S7Pointer1E11sockaddr_in_object* %3, i32 0, i32 0
  %5 = load %root.lib.sockaddr_in*, %root.lib.sockaddr_in** %4, align 8
  %6 = bitcast %root.lib.sockaddr_in* %5 to i8**
  %7 = load i8*, i8** %6, align 8
  ret i8* %7
}

define void @root.lib.S7Pointer1E3i32._Z11constructor2E4Self1T(%root.lib.S7Pointer1E3i32 %0, i32 %1) {
entry:
  ret void
}

define i32 @root.lib.S7Pointer1E3i32._Z4size1E4Self(%root.lib.S7Pointer1E3i32 %0) {
entry:
  ret i32 ptrtoint (i32* getelementptr (i32, i32* null, i32 1) to i32)
}

define i32* @root.lib.S7Pointer1E3i32._Z13value_pointer1E4Self(%root.lib.S7Pointer1E3i32 %0) {
entry:
  %1 = alloca %root.lib.S7Pointer1E3i32, align 8
  store %root.lib.S7Pointer1E3i32 %0, %root.lib.S7Pointer1E3i32* %1, align 1
  %2 = getelementptr inbounds %root.lib.S7Pointer1E3i32, %root.lib.S7Pointer1E3i32* %1, i32 0, i32 0
  %3 = load %root.lib.S7Pointer1E3i32_object*, %root.lib.S7Pointer1E3i32_object** %2, align 8
  %4 = getelementptr inbounds %root.lib.S7Pointer1E3i32_object, %root.lib.S7Pointer1E3i32_object* %3, i32 0, i32 0
  %5 = load i32*, i32** %4, align 8
  ret i32* %5
}

define i32 @root.lib.S7Pointer1E3i32._Z11dereference1E4Self(%root.lib.S7Pointer1E3i32 %0) {
entry:
  ret i1 undef
}

define i8* @root.lib.S7Pointer1E3i32._Z17structure_pointer1E4Self(%root.lib.S7Pointer1E3i32 %0) {
entry:
  %1 = alloca %root.lib.S7Pointer1E3i32, align 8
  store %root.lib.S7Pointer1E3i32 %0, %root.lib.S7Pointer1E3i32* %1, align 1
  %2 = getelementptr inbounds %root.lib.S7Pointer1E3i32, %root.lib.S7Pointer1E3i32* %1, i32 0, i32 0
  %3 = load %root.lib.S7Pointer1E3i32_object*, %root.lib.S7Pointer1E3i32_object** %2, align 8
  %4 = getelementptr inbounds %root.lib.S7Pointer1E3i32_object, %root.lib.S7Pointer1E3i32_object* %3, i32 0, i32 0
  %5 = load i32*, i32** %4, align 8
  %6 = bitcast i32* %5 to i8**
  %7 = load i8*, i8** %6, align 8
  ret i8* %7
}

define void @root.lib.S3Vec1E2u8._Z4push2E4Self1T(%root.lib.S3Vec1E2u8 %0, i8 %1) {
entry:
  ret void
}

define i8 @root.lib.S3Vec1E2u8._Z9__index__2E4Self3i64(%root.lib.S3Vec1E2u8 %0, i64 %1) {
entry:
  ret i1 undef
}

define void @root.lib.S3Vec1E2u8._Z11constructor1E4Self(%root.lib.S3Vec1E2u8 %0) {
entry:
  ret void
}

define void @root.lib.S3Vec1E2u8._Z9__index__3E4Self3i641T(%root.lib.S3Vec1E2u8 %0, i64 %1, i8 %2) {
entry:
  ret void
  ret void
}

define i8 @root.lib.S3Vec1E2u8._Z3pop1E4Self(%root.lib.S3Vec1E2u8 %0) {
entry:
  %1 = alloca %root.lib.S3Vec1E2u8, align 8
  %temp_32 = alloca %root.lib.S3Vec1E2u8, align 8
  store %root.lib.S3Vec1E2u8 %0, %root.lib.S3Vec1E2u8* %temp_32, align 1
  %2 = load %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %temp_32, align 1
  store %root.lib.S3Vec1E2u8 %2, %root.lib.S3Vec1E2u8* %1, align 1
  %3 = getelementptr inbounds %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %1, i32 0, i32 1
  %4 = load %root.lib.S3Vec1E2u8_static*, %root.lib.S3Vec1E2u8_static** %3, align 8
  %5 = getelementptr inbounds %root.lib.S3Vec1E2u8_static, %root.lib.S3Vec1E2u8_static* %4, i32 0, i32 1
  %6 = load i8 (%root.lib.S3Vec1E2u8, i64)*, i8 (%root.lib.S3Vec1E2u8, i64)** %5, align 8
  %temp_321 = alloca %root.lib.S3Vec1E2u8, align 8
  store %root.lib.S3Vec1E2u8 %0, %root.lib.S3Vec1E2u8* %temp_321, align 1
  %7 = load %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %temp_321, align 1
  %8 = alloca %root.lib.S3Vec1E2u8, align 8
  store %root.lib.S3Vec1E2u8 %0, %root.lib.S3Vec1E2u8* %8, align 1
  %9 = getelementptr inbounds %root.lib.S3Vec1E2u8, %root.lib.S3Vec1E2u8* %8, i32 0, i32 0
  %10 = load %root.lib.S3Vec1E2u8_object*, %root.lib.S3Vec1E2u8_object** %9, align 8
  %11 = getelementptr inbounds %root.lib.S3Vec1E2u8_object, %root.lib.S3Vec1E2u8_object* %10, i32 0, i32 1
  %12 = load i64, i64* %11, align 4
  %13 = call i8 %6(%root.lib.S3Vec1E2u8 %7, i64 %12)
  ret i8 %13
}

define void @root.lib.S3Vec1E6String._Z4push2E4Self1T(%root.lib.S3Vec1E6String %0, %root.lib.String %1) {
entry:
  ret void
}

define %root.lib.String @root.lib.S3Vec1E6String._Z9__index__2E4Self3i64(%root.lib.S3Vec1E6String %0, i64 %1) {
entry:
  ret i1 undef
}

define void @root.lib.S3Vec1E6String._Z11constructor1E4Self(%root.lib.S3Vec1E6String %0) {
entry:
  ret void
}

define void @root.lib.S3Vec1E6String._Z9__index__3E4Self3i641T(%root.lib.S3Vec1E6String %0, i64 %1, %root.lib.String %2) {
entry:
  ret void
  ret void
}

define %root.lib.String @root.lib.S3Vec1E6String._Z3pop1E4Self(%root.lib.S3Vec1E6String %0) {
entry:
  %1 = alloca %root.lib.S3Vec1E6String, align 8
  %temp_34 = alloca %root.lib.S3Vec1E6String, align 8
  store %root.lib.S3Vec1E6String %0, %root.lib.S3Vec1E6String* %temp_34, align 1
  %2 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_34, align 1
  store %root.lib.S3Vec1E6String %2, %root.lib.S3Vec1E6String* %1, align 1
  %3 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %1, i32 0, i32 1
  %4 = load %root.lib.S3Vec1E6String_static*, %root.lib.S3Vec1E6String_static** %3, align 8
  %5 = getelementptr inbounds %root.lib.S3Vec1E6String_static, %root.lib.S3Vec1E6String_static* %4, i32 0, i32 1
  %6 = load %root.lib.String (%root.lib.S3Vec1E6String, i64)*, %root.lib.String (%root.lib.S3Vec1E6String, i64)** %5, align 8
  %temp_341 = alloca %root.lib.S3Vec1E6String, align 8
  store %root.lib.S3Vec1E6String %0, %root.lib.S3Vec1E6String* %temp_341, align 1
  %7 = load %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %temp_341, align 1
  %8 = alloca %root.lib.S3Vec1E6String, align 8
  store %root.lib.S3Vec1E6String %0, %root.lib.S3Vec1E6String* %8, align 1
  %9 = getelementptr inbounds %root.lib.S3Vec1E6String, %root.lib.S3Vec1E6String* %8, i32 0, i32 0
  %10 = load %root.lib.S3Vec1E6String_object*, %root.lib.S3Vec1E6String_object** %9, align 8
  %11 = getelementptr inbounds %root.lib.S3Vec1E6String_object, %root.lib.S3Vec1E6String_object* %10, i32 0, i32 1
  %12 = load i64, i64* %11, align 4
  %13 = call %root.lib.String %6(%root.lib.S3Vec1E6String %7, i64 %12)
  ret %root.lib.String %13
}
