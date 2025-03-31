# Nest采用multer实现文件上传

首先需要安装multer的typescript的类型依赖:
```ts
pnpm add -D @types/multer
```

然后在app.controller.ts中写入对应的multer上传文件的请求:

```typescript
import {
  Controller,
  Get,
  UploadedFile,
  UseInterceptors,
  Post,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('aaa')
  @UseInterceptors(
    FileInterceptor('aaa', {
      dest: 'uploads',
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body) {
    console.log('body', body);
    console.log('file', file);
  }
}

```

**1. @UseInterceptors(FileInterceptor(...)) 的作用**



@UseInterceptors(FileInterceptor('aaa', { dest: 'uploads' })) 的作用是拦截传入的 HTTP 请求，并使用 Multer（一个文件上传中间件）来处理文件上传。具体来说：

​	•	FileInterceptor('aaa') 指定了 aaa 作为表单字段的名称，NestJS 会在请求中寻找该字段对应的文件。

​	•	dest: 'uploads' 指定了上传文件的存储目录，即文件将被存储到 uploads 文件夹中。



NestJS 的 Interceptor 允许在请求进入控制器之前或返回响应之前执行额外的逻辑，而 FileInterceptor 就是专门用于拦截文件上传请求的拦截器 。



**2. @UploadedFile() 和 @Body() 参数声明的作用**



在 uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body) 方法中：

​	•	@UploadedFile() file: Express.Multer.File

​	•	@UploadedFile() 是 NestJS 提供的一个装饰器，用于从 FileInterceptor 处理后的请求中提取上传的单个文件。

​	•	file 参数的类型 Express.Multer.File 说明该参数符合 Multer 处理后的文件对象，包含 originalname、filename、size、mimetype 等信息。

​	•	@Body() body

​	•	@Body() 用于解析请求体中的其他非文件数据，例如表单中的文本字段等。



这意味着：

​	•	如果前端发送的是 multipart/form-data，文件会被 FileInterceptor 处理，并作为 file 传递给方法。

​	•	其他表单数据（如文本输入）会被 @Body() 解析，并传递给 body 变量 。



这样，你可以在一个请求中同时获取上传的文件和表单数据，非常方便处理用户提交的内容。



下面，我们需要`npx http-server .`启动前端的静态页面，这个命令的作用是:

​	1.	**避免跨域（CORS）问题**：如果你直接在浏览器中打开 HTML 文件（例如 file:// 协议），它可能会因为浏览器的安全限制而无法向 http://localhost:3000 这样的服务器端 API 发送请求。通过 http-server 以 http://localhost:8080 的形式运行，可以模拟正式环境，避免 CORS 限制。

​	2.	**模拟真实服务器环境**：使用 http-server 可以让你的前端代码在一个本地 Web 服务器上运行，类似于生产环境，而不仅仅是本地文件系统。这有助于测试和调试。

​	3.	**处理相对路径和资源加载**：如果你的项目有图片、CSS、JS 文件，直接打开 HTML 可能会遇到路径解析错误，而 http-server 可以正确地解析它们。

​	4.	**方便前端开发**：使用 http-server 还能支持热重载（如果结合 live-server 等工具），使开发更加高效。

### 单文件上传

上传完成后的打印结果:|
![image-20250331000454487](/Users/heinrichhu/前端项目/NestJS_SD/15_nest-multer-upload/assets/image-20250331000454487.png)



前面指定的name,age都是通过@body() body这个装饰器来进行获取的，除此以外，我们获取到的file是FileInterceptor处理后返还的上传文件格式类型。



### 多文件上传

```typescript
  @Post('bbb')
  @UseInterceptors(
    FilesInterceptor('bbb', 10, {
      dest: 'uploads',
    }),
  )
  uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body,
  ) {
    console.log('body', body);
    console.log('files', files);
    return 'success';
  }
```



```js
     async function formData2() {
    const data = new FormData();
    data.set('name','光');
    data.set('age', 20);
    [...fileInput.files].forEach(item => {
        data.append('bbb', item)
    })

    const res = await axios.post('http://localhost:3000/bbb', data, {
        headers: { 'content-type': 'multipart/form-data' }
    });
    console.log(res);
}
```

这里我们只需要引入 @UploadedFiles()装饰器和@FilesInterceptor装饰器，并且采用Array对文件类型进行包裹，就可以实现多文件的上传处理。



## FileInterceptor的作用

在 NestJS 中，FileInterceptor、FilesInterceptor、FileFieldsInterceptor 和 AnyFilesInterceptor 都是 @nestjs/platform-express 提供的文件上传拦截器，它们基于 Multer 库实现，用于处理不同类型的文件上传需求。



------



**1. FileInterceptor**

**处理单文件上传**

**使用场景：**

当你的 API 需要上传 **单个文件** 时，使用 FileInterceptor 拦截请求并解析单个文件。



**示例代码：**

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', { dest: 'uploads' }))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log('Uploaded file:', file);
  return 'File uploaded successfully';
}
```

​	•	FileInterceptor('file') 里的 'file' 必须匹配前端 FormData 里的字段名。

​	•	@UploadedFile() 获取上传的文件对象，类型为 Express.Multer.File。

​	•	dest: 'uploads' 指定文件存储路径（默认存储在服务器本地）。



**2. FilesInterceptor**

**处理多文件上传（同一个字段名）**



**使用场景：**

当 API 需要 **上传多个文件**（且前端 FormData 中多个文件的字段名相同）时，使用 FilesInterceptor。

**示例代码：**

```typescript
@Post('upload-multiple')
@UseInterceptors(FilesInterceptor('files', 10, { dest: 'uploads' }))
uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
  console.log('Uploaded files:', files);
  return 'Multiple files uploaded successfully';
}
```

​	•	FileInterceptor('file') 里的 'file' 必须匹配前端 FormData 里的字段名。

​	•	@UploadedFile() 获取上传的文件对象，类型为 Express.Multer.File。

​	•	dest: 'uploads' 指定文件存储路径（默认存储在服务器本地）。



**3. FileFieldsInterceptor**



**处理多文件上传（不同字段名）**



**使用场景：**

当 API 需要 **上传多个文件**，并且这些文件的字段名不同，比如：

​	•	一个字段 avatar 存放头像

​	•	另一个字段 background 存放背景图片

```typescript
@Post('upload-fields')
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
    { name: 'background', maxCount: 2 },
  ]),
)
uploadMultipleFields(
  @UploadedFiles() files: { avatar?: Express.Multer.File[]; background?: Express.Multer.File[] },
) {
  console.log('Avatar file:', files.avatar);
  console.log('Background files:', files.background);
  return 'Files uploaded successfully';
}
```

​	•	每个 name 是前端 FormData 的字段名。

​	•	maxCount 限制该字段最多上传多少个文件。

​	•	@UploadedFiles() 获取一个对象，键是字段名，值是对应的文件数组。



**4. AnyFilesInterceptor**



**处理不确定字段名的文件上传**



**使用场景：**

当 API **不限制上传的文件字段名**，即所有上传的文件都应该被接受时，使用 AnyFilesInterceptor。



**示例代码：**

```typescript
@Post('upload-any')
@UseInterceptors(AnyFilesInterceptor({ dest: 'uploads' }))
uploadAnyFile(@UploadedFiles() files: Express.Multer.File[]) {
  console.log('Uploaded files:', files);
  return 'Files uploaded successfully';
}
```

​	•	@UploadedFiles() 获取 Express.Multer.File[] 类型的数组，包含所有上传的文件。

​	•	不管前端 FormData 里的文件字段名是什么，都会被拦截并处理。





### **NestJS 文件上传拦截器 (Interceptors) 的工作原理**



在 NestJS 中，FileInterceptor、FilesInterceptor、FileFieldsInterceptor 和 AnyFilesInterceptor 这些拦截器本质上是基于 Multer 这个 Express 中间件的封装。

它们的作用是 **拦截请求**，并在请求进入 Controller 方法之前，**解析并处理上传的文件**，最终将解析后的文件信息附加到 request 对象上。



------



**1. 工作原理概览**



当客户端发送 multipart/form-data 类型的请求（通常用于文件上传）时，这些拦截器会：

​	1.	**拦截请求**：拦截进入 Controller 之前的 HTTP 请求。

​	2.	**解析文件数据**：**使用 Multer 解析 multipart/form-data 请求体，**将上传的文件存储到本地或其他存储介质（如云存储）。

​	3.	**将解析结果附加到请求对象**：文件数据被添加到 req.file 或 req.files，然后交给 @UploadedFile() 或 @UploadedFiles() 访问。

​	4.	**继续执行 Controller 方法**：文件解析完成后，请求继续进入 Controller 处理逻辑。



------



**2. 深入拦截器的内部机制**



NestJS 通过 @UseInterceptors() 让 Interceptors 作用于特定的 Controller 方法。每个拦截器的内部都基于 Multer 实现，但它们处理的逻辑稍有不同。



**(1) FileInterceptor：处理单文件**



源码（简化版）：

```typescript
export function FileInterceptor(fieldName: string, options?: MulterOptions) {
  return new Interceptor(FileInterceptor, {
    fileName,
    options,
  });
}
```

​	•	**拦截请求**

​	•	**调用 multer.single(fieldName)**

​	•	**解析并存储单个文件**

​	•	**将文件存储到 req.file**



等效于：

```typescript
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file); // 解析后的文件信息
  res.send('File uploaded');
});
```



**3. @UploadedFile() / @UploadedFiles() 的作用**



这些装饰器只是 NestJS 提供的 **参数解析器**，它们的作用是：

​	•	**从 req.file 或 req.files 中提取数据**

​	•	**直接赋值给 Controller 方法的参数**

​	•	**避免手动解析 req**

```typescript
uploadFile(@UploadedFile() file: Express.Multer.File)
```

等效于：

```typescript
uploadFile(@Req() req) {
  const file = req.file;
}
```



### 总结

​	1.	**NestJS 的文件上传拦截器是对 Multer 的封装**，用来解析 multipart/form-data 请求体。

​	2.	**拦截器的核心功能：**

​	•	解析文件数据

​	•	存储文件（本地/云端）

​	**•	将解析后的文件数据添加到 req.file 或 req.files**

​	3.	**不同拦截器的区别：**

​	•	FileInterceptor → 处理单个文件 (req.file)

​	•	FilesInterceptor → 处理多个文件（同字段）(req.files)

​	•	FileFieldsInterceptor → 处理多个不同字段的文件 (req.files)

​	•	AnyFilesInterceptor → 处理任意字段的文件 (req.files)

​	4.	**NestJS 的 @UploadedFile() / @UploadedFiles() 只是一个参数解析器**，用来从 req.file / req.files 中提取数据。











## 装饰器@UploadedFile的具体功效

在 NestJS 中，@UploadedFile() 和 @UploadedFiles() 这些装饰器的作用是从 request 对象中提取上传的文件数据，并将其作为参数传入控制器方法（handler）。它们本质上是简化了手动从 req 对象中提取 file 或 files 的过程。



**具体作用：**

​	1.	**@UploadedFile()**

​	•	适用于单文件上传（通常与 FileInterceptor() 搭配使用）。

​	•	作用是从 request 对象中提取 file 属性，并将其作为方法参数传入。

```TS
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file); // file 是从 req.file 取出的
}
```

​	2.	**@UploadedFiles()**

​	•	适用于多文件上传（通常与 FilesInterceptor() 或 FileFieldsInterceptor() 搭配使用）。

​	•	作用是从 request 对象中提取 files 数组，并将其作为方法参数传入。

```typescript
@Post('upload-multiple')
@UseInterceptors(FilesInterceptor('files', 10))
uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files); // files 是从 req.files 取出的
}
```



​	3.	**底层逻辑**

​	•	这些装饰器只是简化了 req.file 和 req.files 的获取过程，相当于 req.file 或 req.files 的快捷方式。

​	•	在底层，NestJS 依赖 Multer 进行文件处理，而 Interceptors（如 FileInterceptor、FilesInterceptor）的作用是调用 Multer 处理文件，并将结果存入 req 对象中，随后 @UploadedFile() 和 @UploadedFiles() 负责提取这些数据。



因此，这些装饰器的作用并不是处理文件上传的逻辑，而是仅仅从 request 中提取 file 或 files 作为参数传递给控制器方法【126】。









