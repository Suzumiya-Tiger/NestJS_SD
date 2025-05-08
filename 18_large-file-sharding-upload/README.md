# 文件上传分块逻辑

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="https://unpkg.com/axios@0.24.0/dist/axios.min.js"></script>
</head>

<body>
  <input id="fileInput" type="file" multiple />
  <script>
    const fileInput = document.querySelector('#fileInput');

    const chunkSize = 20 * 1024;

    fileInput.onchange = async function () {
      const file = fileInput.files[0];
      console.log('file', file);

      const chunks = []
      let startPos = 0
      while (startPos < file.size) {
        chunks.push(file.slice(startPos, startPos + chunkSize))
        startPos += chunkSize
      }
      const randomStr = Math.random().toString().slice(2, 8)
      const fileNameForChunks = `${randomStr}-${file.name}`;
      const tasks = [];

      chunks.forEach((chunk, index) => {
        tasks.push((async () => {
          const data = new FormData();
          data.set('name', `${fileNameForChunks}-${index}`);
          data.append('files', chunk);

          let retries = 3;
          while (retries > 0) {
            try {
              console.log(`Attempting to upload chunk ${index}, retries left: ${retries}`);
              const res = await axios.post('http://localhost:3000/upload', data);
              console.log(`Chunk ${index} uploaded successfully`);
              return res;
            } catch (error) {
              retries--;
              console.error(`Chunk ${index} upload failed. Error: ${error.message}. Retries left: ${retries}`);
              if (retries === 0) {
                throw new Error(`Chunk ${index} failed to upload`);
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        })());
      });

      try {
        console.log('tasks', tasks);

        const results = await Promise.all(tasks);
        console.log('All chunks processed successfully:', results);
        axios.get('http://localhost:3000/merge?name=' + fileNameForChunks);
      } catch (error) {
        console.error('An error occurred during chunk uploads:', error.message);
      }
    }
  </script>
</body>

</html>
```

1. **await new Promise(resolve => setTimeout(resolve, 1000)); 的作用是什么？**

这行代码的作用是暂停当前 async 函数的执行 1000 毫秒（即 1 秒钟）。

- setTimeout(resolve, 1000): 这是一个标准的 JavaScript 函数，它会在 1000 毫秒后调用 resolve 函数。

- new Promise(resolve => ...): 这创建了一个新的 Promise 对象。这个 Promise 会在 resolve 函数被调用时变为 "resolved" (已完成) 状态。

- await: await 关键字只能在 async 函数内部使用。当遇到 await 后面跟着一个 Promise 时，它会暂停 async 函数的执行，直到这个 Promise 被 resolved (或者 rejected)。

在这个具体的场景中（上传失败后的重试逻辑里）：

```js
    // ...
          } catch (error) {
            retries--;
            console.error(`Chunk ${index} upload failed. Error: ${error.message}. Retries left: ${retries}`);
            if (retries === 0) {
              console.error(`Chunk ${index} failed to upload after multiple retries.`);
              throw new Error(`Chunk ${index} failed to upload`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // 在这里
          }
    // ...
```

它的目的是在某一个文件块（chunk）上传失败后，不立即进行下一次重试，而是等待1秒钟。这样做的好处是：

- 避免对服务器造成过大压力：如果网络暂时性抖动或服务器暂时繁忙，立即重试可能会加剧问题。短暂的等待可以给服务器或网络一个恢复的机会。

- 提高重试成功率：对于某些瞬时性的错误，等待一段时间后再重试，成功的概率可能会更高。



**2. const results = await Promise.all(tasks); 这行代码为什么要集中请求 tasks？这么设计有什么用吗？**

当您在forEach循环中执行 tasks.push((async () => { ... })()) 时：

1. 立即执行的异步函数 (IIAFE - Immediately Invoked Async Function Expression):

- (async () => { ... }) 定义了一个异步函数。

- 末尾的 () 立即调用了这个异步函数。

- 关键点：异步函数被调用时，它会 立即返回一个Promise对象。这个Promise对象初始状态是 "pending" (挂起)。

2. tasks 数组填充:

- tasks.push(...) 将这个刚刚返回的、处于 "pending" 状态的Promise对象添加到了 tasks 数组中。

- 这个过程是非常快的，循环会迅速执行完毕，tasks 数组很快就会被填满这些 "pending"状态的Promise。

3. 打印 tasks:

- 如果您在 forEach 循环之后、await Promise.all(tasks) 之前打印 tasks 数组，您会看到数组里充满了 Promise { <pending> } 这样的对象。

- 这是因为此刻，异步函数内部的 await axios.post(...) 等操作可能还没有完成。它们正在后台执行网络请求。控制台打印的是这些Promise对象在被推入数组那一刻的快照状态。

4. await Promise.all(tasks) 的作用:

- 这一行代码是魔法发生的地方。

- Promise.all() 接收一个Promise数组（即我们的 tasks 数组）。

- 它会等待 tasks 数组中的 所有 Promise都从 "pending" 状态变为 "resolved" (成功解决) 状态。

- 如果中途有任何一个Promise变为 "rejected" (失败) 状态，Promise.all() 会立即以那个失败的原因reject。

- await 关键字会暂停 fileInput.onchange 函数的执行，直到 Promise.all(tasks) 本身这个Promise解决（即所有上传任务都成功完成）。

为什么看起来是空的但能实现需求？

- "空"的误解：您看到的 Promise { <pending> } 并非真正的 "空" 或 "无效"。它是一个占位符，代表一个尚未完成的异步操作及其最终结果。它是有状态的，并且会随着其内部异步操作的完成而改变状态。

- 异步执行：虽然tasks数组被快速填充了这些pending的Promise，但每个Promise内部的上传逻辑（axios.post和重试）是在后台独立、并发执行的。

- 同步点：await Promise.all(tasks) 提供了一个同步点。它确保了在继续执行后续代码（如发送合并请求）之前，所有这些独立的、并发的上传任务都已经成功完成。

总结：

tasks 数组里装的是一个个的“承诺”，每个“承诺”代表一个分片的上传任务（包括其重试逻辑）。这些承诺在被创建时（即异步函数被调用时）是“待定”的。Promise.all 就像一个监工，它会盯着所有这些“承诺”，直到每一个都兑现（上传成功），然后才允许整个流程继续下去。

如果您在所有Promise都resolved之后再打印tasks（例如，在 Promise.all 成功后的 .then() 回调里，或者在 await Promise.all(tasks) 之后的一行），您可能会看到它们的状态变成了 Promise { <resolved>: ... }，并且里面会包含 axios.post 返回的 res 对象。但通常我们更关心 Promise.all 的整体结果。



# 文件读取和存储逻辑

```typescript
import {
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      dest: 'uploads',
    }),
  )
  uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { name: string },
  ) {
    console.log('body', body);
    console.log('files', files);

    const matches = body.name.match(/(.+)\-\d+$/);

    if (!matches || !matches[1]) {
      console.error(
        `Error: Filename '${body.name}' does not match expected pattern 'name-number'.`,
      );
      // In a real application, you might throw an HttpException here, e.g.:
      // import { HttpException, HttpStatus } from '@nestjs/common';
      // throw new HttpException(`Invalid filename format: ${body.name}`, HttpStatus.BAD_REQUEST);
      return; // Stop further processing if the name format is invalid
    }

    const fileName: string = matches[1];
    const chunkDir = 'uploads/chunks_' + fileName;

    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    }
    fs.cpSync(files[0].path, chunkDir + '/' + body.name);
    fs.rmSync(files[0].path);
  }
}

```



## matches 变量和它需要匹配的内容

- body.name 是什么？

首先，你要知道 body.name 是前端（index.html）在上传每个文件块（chunk）时，通过 FormData 发送过来的一个字段。在前端代码中，它是这样设置的：

```typescript
    data.set('name', `${file.name}-${index}`);
```

这里的 file.name 是用户选择的原始文件的名字（比如 myphoto.jpg、bigvideo.mp4），index 是这个文件块的序号（从0开始）。所以，如果用户上传一个名为 myphoto.jpg 的文件，它被分成了3个块，那么发送到后端的 body.name 会依次是：

- myphoto.jpg-0 (第一个块)

- myphoto.jpg-1 (第二个块)

- myphoto.jpg-2 (第三个块)

- 正则表达式 /(.+)\-\d+$/ 需要匹配什么？

这个正则表达式就是用来处理上面这种 原始文件名-块序号 格式的字符串的。它的目标是从 myphoto.jpg-0 这样的字符串中提取出 myphoto.jpg 这部分（即原始文件名）。

- (.+):

- . 匹配任何单个字符（除了换行符）。

- \+ 表示前面的字符（.）出现一次或多次。

- () 将 .+ 包裹起来，形成一个“捕获组”。这是我们特别感兴趣的部分，因为我们想把这部分内容提取出来。

- \-: 匹配一个字面上的连字符 -。

- \d+:

- \d 匹配任何一个数字（0到9）。

- \+ 表示前面的数字（\d）出现一次或多次。这部分用来匹配块序号。

- $: 匹配字符串的末尾。这确保了 -块序号 这部分是在整个名称的最后。

- matches 变量是什么？

当你执行 const matches = body.name.match(/(.+)\-\d+$/); 时：

- 如果 body.name (比如 myphoto.jpg-0) 能够成功被这个正则表达式匹配：

- matches 会是一个数组。

- matches[0] 是整个匹配到的字符串，即 myphoto.jpg-0。

- matches[1] 是第一个捕获组 (.+) 匹配到的内容，即 myphoto.jpg。这正是我们想要的原始文件名！

- 如果 body.name 不能被匹配（比如格式不对，不是 文件名-数字 的形式），matches 就会是 null。

所以，const fileName: string = matches[1]; 这行代码的目的就是从匹配结果中取出原始文件名。

2. chunkDir 和 chunkDir + '/' + body.name 的作用

- fileName: 从上一步我们知道，fileName 是提取出来的原始文件名，比如 myphoto.jpg。

- const chunkDir = 'uploads/chunks_' + fileName;:

这行代码的目的是为属于同一个原始文件的所有文件块创建一个专属的存储目录。

- 如果 fileName 是 myphoto.jpg，那么 chunkDir 就是 'uploads/chunks_myphoto.jpg'。

- 如果 fileName 是 bigvideo.mp4，那么 chunkDir 就是 'uploads/chunks_bigvideo.mp4'。

接下来的 if (!fs.existsSync(chunkDir)) { fs.mkdirSync(chunkDir); } 就是确保这个目录存在，如果不存在就创建它。

- fs.cpSync(files[0].path, chunkDir + '/' + body.name);

这行代码是将当前上传的这个文件块，从它被Multer（NestJS的文件上传处理中间件）临时保存的地方，复制到我们为它规划好的最终位置。

- files[0].path: 这是文件块被上传后，临时存储在服务器上的路径。

- chunkDir + '/' + body.name: 这是文件块要被复制到的目标路径。

- chunkDir: 是我们上面创建的专属目录，比如 'uploads/chunks_myphoto.jpg'。

- /: 是路径分隔符。

- body.name: 是当前这个特定文件块的完整名字，比如 myphoto.jpg-0。

所以，chunkDir + '/' + body.name 拼接起来的完整路径就是，例如：'uploads/chunks_myphoto.jpg/myphoto.jpg-0'。

为什么还要在 chunkDir 后面再加一个 body.name？

- chunkDir (uploads/chunks_myphoto.jpg) 只是一个文件夹，它用来存放所有属于 myphoto.jpg 这个原始文件的所有块。

- body.name (myphoto.jpg-0, myphoto.jpg-1 等) 是每个文件块在这个文件夹里面的具体文件名。我们需要用它来区分这个文件夹里的不同块，并且这个名字也包含了块的顺序信息。

设想一下文件结构：

```tcl
    uploads/
        chunks_myphoto.jpg/  <-- chunkDir for myphoto.jpg
            myphoto.jpg-0    <-- body.name (chunk 0)
            myphoto.jpg-1    <-- body.name (chunk 1)
            myphoto.jpg-2    <-- body.name (chunk 2)
        chunks_bigvideo.mp4/ <-- chunkDir for bigvideo.mp4
            bigvideo.mp4-0
            bigvideo.mp4-1
            ...
```

这样做的好处是：

1. 组织清晰：所有属于同一个大文件的块都放在同一个文件夹里。
2. 块的唯一性：每个块在它的文件夹里都有一个唯一的名字（因为有 -序号 后缀），不会互相覆盖。
3. 方便合并：当所有块都上传完毕后，服务器就可以很容易地找到对应 chunkDir 目录下的所有块文件，然后按照序号把它们合并成完整的原始文件。



## 合并分片

```typescript
  @Get('merge')
  merge(@Query('name') name: string) {
    const chunkDir = 'uploads/chunks_' + name;
    const files = fs.readdirSync(chunkDir);

    let startPos = 0;
    files.map((file) => {
      const filePath = chunkDir + '/' + file;
      const stream = fs.createReadStream(filePath, { start: startPos });
      stream.pipe(
        fs.createWriteStream('uploads/' + name, {
          start: startPos,
        }),
      );
      startPos += fs.statSync(filePath).size;
    });
  }
```

### 合并分片过程详解 (merge 方法)

这个 merge 方法的目的是在所有文件块（分片）都上传完毕后，将它们合并成一个完整的原始文件。

1. @Get('merge') merge(@Query('name') name: string):

- 这定义了一个 HTTP GET 请求的路由，路径是 /merge。

- 它期望一个查询参数 name，这个 name 应该是之前上传文件时提取出来的原始文件名 (比如 myphoto.jpg)。前端在所有块上传完成后，会调用这个接口，并传入这个原始文件名。

2. const chunkDir = 'uploads/chunks_' + name;:

- 和上传时类似，这行代码构造出存放该原始文件所有分片的目录路径。例如，如果 name 是 myphoto.jpg，那么 chunkDir 就是 uploads/chunks_myphoto.jpg。

3. const files = fs.readdirSync(chunkDir);:

- fs.readdirSync(chunkDir) 会同步地读取 chunkDir 目录下的所有文件名，并将它们以一个字符串数组的形式返回给 files。

- 例如，files 可能会是 ['myphoto.jpg-0', 'myphoto.jpg-1', 'myphoto.jpg-2']。

- **注意：fs.readdirSync 返回的文件名顺序是不保证的，这在目前的实现中是一个潜在问题，我们稍后讨论。理想情况下，你应该对 files 数组进行排序，确保它们按照块的序号 (0, 1, 2...) 排列。**

4. let startPos = 0;:

- startPos (起始位置) 初始化为0。这个变量非常关键，它用于追踪在最终合并的目标文件中，当前块应该从哪个字节位置开始写入。

5. files.map((file) => { ... });:

- 这里遍历 files 数组中的每一个分片文件名。

6. const filePath = chunkDir + '/' + file;:

- 构造出当前正在处理的这个分片文件的完整路径，例如 uploads/chunks_myphoto.jpg/myphoto.jpg-0。

7. const stream = fs.createReadStream(filePath); (这里我稍微修改了你的代码，去掉了 { start: startPos }，因为通常读取分片时是从分片文件的开头完整读取)

- 为当前的分片文件 (filePath) 创建一个可读流 (stream)。这个流会从该分片文件的开头开始读取数据。

8. stream.pipe( fs.createWriteStream('uploads/' + name, { start: startPos, flags: 'a' }) );

- 这是核心的合并步骤。

- fs.createWriteStream('uploads/' + name, { start: startPos, flags: 'a' }):

- 'uploads/' + name: 这是最终合并后的大文件的路径，例如 uploads/myphoto.jpg。

- { start: startPos, flags: 'a' }: 这部分是创建可写流时的选项。

- start: startPos: 非常重要！它告诉可写流，从 startPos 指定的字节偏移量开始写入数据到目标文件 (uploads/myphoto.jpg)。

- 对于第一个分片 (myphoto.jpg-0)，startPos 是 0，所以它的内容会从目标文件的第0个字节开始写入。

- 对于第二个分片 (myphoto.jpg-1)，startPos 应该是第一个分片的大小，所以它的内容会紧接着第一个分片的内容写入。

- flags: 'a': 这个标志代表 "append" (追加) 模式。它确保如果目标文件不存在，则创建它；如果存在，则从指定位置 (startPos) 开始写入，而不会覆盖文件开头的内容。这对于分块合并至关重要。

- **stream.pipe(...): pipe 方法是 Node.js 流的精髓。它将可读流 (stream，即当前分片的内容) 的输出“管道连接”到可写流 (写入到最终合并文件) 的输入。这意味着，当从分片文件读取数据时，这些数据会自动地、高效地写入到最终合并文件的正确位置。**

9. startPos += fs.statSync(filePath).size;:

- fs.statSync(filePath).size 获取当前分片文件的大小（字节数）。

- 将这个大小累加到 startPos 上。这样，当下一次循环处理下一个分片时，startPos 就会是下一个分片在最终合并文件中应该开始写入的正确字节偏移量。



### 原理理解和疑问解答

**为什么不直接逐个读取，而是采用 stream.pipe(...) 方式？**

你的问题非常好，触及了 Node.js 中流的核心优势。

- “直接逐个读取”可能的含义：

1. 读取整个分片到内存，再一次性写入：

```typescript
        // 伪代码 - 不推荐的方式
        const data = fs.readFileSync(filePath); // 读取整个分片到内存
        fs.appendFileSync('uploads/' + name, data); // 追加到目标文件 (这种方式难以精确控制写入位置)
        // 或者更精确地控制位置，但依然是先读到内存
        // fs.writeSync(fd, data, 0, data.length, startPos);
```

这种方式的缺点：

- 内存消耗大：如果分片本身很大 (比如几MB甚至几十MB)，将整个分片读入内存会消耗大量内存。如果有多个并发的合并请求，内存很容易被耗尽。

- 效率较低：数据需要先完整加载到内存，然后再写入磁盘，涉及多次数据复制。

2. 自己实现小块读取和写入循环：

```typescript
        // 伪代码 - 复杂且不必要
        const readStream = fs.createReadStream(filePath);
        const writeStream = fs.createWriteStream('uploads/' + name, { start: startPos, flags: 'a' });
        readStream.on('data', (chunk) => {
            writeStream.write(chunk); // 手动读取一小块，写入一小块
        });
        readStream.on('end', () => {
            writeStream.end();
            // 处理下一个文件
        });
```

这种方式虽然可以避免一次性加载整个分片到内存，但你需要手动管理数据块的读取、写入、结束等事件，代码会变得更复杂。

- 采用 stream.pipe(...) 的优势 (Node.js 流的优势)：

1. 内存效率高：pipe 机制在内部处理数据的流动。它不是一次性把整个可读流的数据都读到内存，然后再全部写入可写流。相反，它是一小块一小块地读取数据 (chunk by chunk)，然后立即将这一小块数据写入到可写流。这意味着在任何时刻，内存中只需要存放一小部分正在传输的数据，极大地减少了内存占用。这对于处理大文件或大量并发请求至关重要。
2. 自动处理背压 (Backpressure)：这是一个非常重要的概念。如果可写流的处理速度跟不上可读流的读取速度（比如磁盘写入慢，但文件读取快），数据就会在内存中堆积。pipe 内部有自动的流量控制机制。当可写流太忙碌时，它会通知可读流暂停读取，直到可写流能够处理更多数据时再恢复。这可以防止内存溢出，并使数据传输更稳定。自己实现这种背压管理会非常复杂。
3. 代码简洁优雅：stream.pipe(destination) 这一行代码就完成了复杂的数据传输、流量控制和错误处理（基本的错误会通过事件冒泡）。它抽象了底层的复杂性，让开发者能用更少的代码完成任务。
4. 可组合性：流可以像管道一样连接起来，形成数据处理链。例如，你可以 readStream.pipe(transformStream).pipe(writeStream)，在数据从读取到写入的过程中进行转换（如压缩、加密等）。

总结 pipe 的好处就是：更少的内存占用、自动的流量控制、更简洁的代码。

关于 fs.createReadStream(filePath, { start: startPos }); 的澄清：

在我最初的分析中，我注意到你在 createReadStream 中也使用了 start: startPos。

fs.createReadStream(filePath, { start: offset, end: offset + length - 1 }) 允许你只读取文件的一部分。

在合并分片的场景中，每个分片文件 (filePath) 通常是需要完整读取的，从它自己的第0个字节开始，一直到它的末尾。

而 startPos 的作用是告诉 fs.createWriteStream 在目标合并文件 ('uploads/' + name) 中的哪个位置开始写入当前分片的数据。

所以，更典型的做法是：

```typescript
// 读取当前分片文件的全部内容
const readStreamForChunk = fs.createReadStream(filePath);

// 将分片内容写入到目标大文件的 startPos 位置
readStreamForChunk.pipe(
    fs.createWriteStream('uploads/' + name, {
        flags: 'a', // 使用追加模式，并依赖 startPos (默认行为)
        start: startPos // 明确指定在目标文件中的写入起始位置
    })
);
```

fs.createWriteStream 的 start 选项在这里是关键，它确保每个分片被精确地放置在最终文件的正确偏移量上。而读取每个分片时，我们通常从分片的开头完整读取。



## 代码改进和优化



**分片顺序：**fs.readdirSync() 不保证返回文件名的顺序。你需要对 files 数组进行排序，以确保它们按照块的序号（例如，从 filename-0, filename-1, ... filename-N）进行处理。否则，合并出来的文件内容会是错乱的。

```js
    const files = fs.readdirSync(chunkDir).sort((a, b) => {
        const numA = parseInt(a.split('-').pop());
        const numB = parseInt(b.split('-').pop());
        return numA - numB;
    });
```



**错误处理：**当前代码缺少错误处理。例如，如果某个分片文件损坏或无法读取，createReadStream 或 pipe 可能会抛出错误，这会导致整个合并过程失败，并且可能不会给前端任何反馈。你应该添加 try...catch 或者监听流的 error 事件。



**异步与阻塞：**fs.readdirSync、fs.statSync 是同步操作，它们会阻塞 Node.js 的事件循环。对于 IO 密集型操作，尤其是在处理多个请求的服务器上，推荐使用它们的异步版本 (**fs.readdir、fs.stat**) 并结合 Promises (async/await) 来避免阻塞。不过，**在 map 内部的 pipe 操作本身是异步的，但 map 循环本身并不会等待 pipe 完成**。这意味着 startPos 的更新可能在 pipe 写入完成之前就发生了，这在流式处理中通常不是问题，因为写入位置是由 createWriteStream 的 start 选项在创建时确定的。但如果需要确保一个 pipe 完成后再进行下一个，就需要更复杂的异步流程控制 (例如使用 for...of 循环配合 await 一个表示 pipe 完成的 Promise)。

```typescript
    async merge(@Query('name') name: string) {
        const chunkDir = 'uploads/chunks_' + name;
        const files = fs.readdirSync(chunkDir).sort((a, b) => { // 确保排序
            const numA = parseInt(a.split('-').pop() || '0');
            const numB = parseInt(b.split('-').pop() || '0');
            return numA - numB;
        });

        const finalFilePath = 'uploads/' + name;
        // 确保目标文件是空的开始，或者根据需要处理已存在的文件
        if (fs.existsSync(finalFilePath)) {
            fs.unlinkSync(finalFilePath); // 删除旧的合并文件
        }

        for (const file of files) {
            const filePath = chunkDir + '/' + file;
            const sourceStream = fs.createReadStream(filePath);
            const destinationStream = fs.createWriteStream(finalFilePath, {
                flags: 'a', // 追加模式
                // 'start' 选项在追加模式下（flags: 'a'）通常不是必需的，
                // 因为 'a' 标志本身意味着从文件末尾开始写入。
                // 但如果我们要精确控制，可以考虑不使用 'a' 而是依赖每次写入的 position。
                // 不过更简单的是确保文件按顺序追加。
                // 如果严格按照顺序写入，每次追加即可。
            });

            await new Promise<void>((resolve, reject) => {
                sourceStream.pipe(destinationStream);
                destinationStream.on('finish', () => {
                    resolve();
                });
                destinationStream.on('error', reject);
                sourceStream.on('error', reject);
            });
        }
        // 合并完成后可以删除分片目录
        // fs.rmdirSync(chunkDir, { recursive: true });
        return { message: `${name} merged successfully.` };
    }
```



1. **if (fs.existsSync(finalFilePath)) { ... }**

- fs.existsSync(finalFilePath): 这是 Node.js 文件系统模块 (fs) 的一个同步方法。

- existsSync 的意思是 "exists synchronously" (同步地存在)。

- 它会检查 finalFilePath 指定的路径下是否存在文件或文件夹。

- 如果存在，它返回 true；如果不存在，它返回 false。

- if (...): 这个条件语句判断 fs.existsSync(finalFilePath) 的结果。如果结果是 true（即文件已存在），则执行大括号 {...} 内的代码。

2. **fs.unlinkSync(finalFilePath);**

- fs.unlinkSync(finalFilePath): 这也是 fs 模块的一个同步方法。

- unlinkSync 的意思是 "unlink synchronously" (同步地断开链接，在文件系统中通常意味着删除文件)。

- **它会删除 finalFilePath 指定的文件。**

- 因为它是同步的 (Sync)，所以程序会在这里暂停，直到文件被成功删除后才会继续执行下一行代码。

在这个改进的版本中，我们为每个 pipe 操作创建了一个 Promise，并 await 它完成，这样可以确保文件块是严格按顺序追加的。不过，如果 createWriteStream 的 start 选项能被正确使用（并且不与 flags: 'a' 冲突），理论上并发 pipe 到不同位置也是可行的，但这会更复杂。对于顺序合并，简单追加通常是最直接的。

更新：查看 Node.js 文档，start 选项在 fs.createWriteStream 中指定的是写入文件的起始偏移量。如果与 flags: 'a' (append) 一起使用，行为可能不是预期的那样在指定 start 位置追加，而是仍然在文件末尾追加。

因此，如果你想精确地将每个块写入到特定位置，应该不使用 flags: 'a'，并确保目标文件已创建且足够大，或者每次打开文件进行写入时都指定正确的文件描述符和位置。

一个更稳妥且利用 start 的方式是确保目标文件预先存在或者在第一次写入时创建，并且不使用 flags: 'a'：

这种使用 start 选项并按顺序 await每个 pipe 的方式，能更精确地控制每个分片写入最终文件的位置。

这个详细的解释希望能帮助你完全理解合并过程和流的运用！



### 分片写入机制

通过在 for...of 循环中，为每一个分片文件的 pipe 操作包装一个 Promise，并且使用 await 等待这个 Promise 完成，就能够确保每一个分片文件是按照 files 数组中排序好的顺序，一个接一个地被完整处理（读取并写入到目标文件）的。

让我们详细回顾一下这个机制：

1. for (const file of files):

- 这个循环会按照 files 数组中的顺序逐个取出文件名。由于你之前对 files 数组进行了排序 (.sort(...))，所以这里的文件名是按照分片序号（如 file-0, file-1, file-2, ...）排列的。

1. await new Promise<void>((resolve, reject) => { ... });:

- 对于循环中的每一个 file（即每一个分片）：

- new Promise<void>((resolve, reject) => { ... }) 创建了一个新的 Promise 对象。

- sourceStream.pipe(destinationStream); 启动了从当前分片文件 (sourceStream) 到最终合并文件 (destinationStream) 的数据传输。这是一个异步操作，它不会立即完成。

- 关键在于 await关键字：

- 当 await 用在一个 Promise 前面时，它会暂停当前 async 函数（在这里是 merge 方法）的执行，直到这个 Promise 被解决 (resolved) 或被拒绝 (rejected)。

- 在这个例子中，for...of 循环的当前迭代会在此处暂停。它不会立即开始处理 files 数组中的下一个文件。

- Promise 的解决与拒绝：

- destinationStream.on('finish', () => { resolve(); });: 当 destinationStream 成功接收并写完了所有来自 sourceStream 的数据后，会触发 'finish' 事件。这时，我们调用 resolve()，这个 Promise 就被成功解决了。

- destinationStream.on('error', reject); 和 sourceStream.on('error', reject);: 如果在数据传输过程中，源流或目标流任何一方发生错误，就会触发 'error' 事件。我们调用 reject(error)，这个 Promise 就被拒绝了（并且 await 会抛出这个错误，如果外面有 try...catch 就能捕获到）。

1. 效果：

- 只有当当前分片的 pipe 操作完成（即 Promise resolve 了，意味着这个分片的数据已经完全写入目标文件了），await 才会结束等待，for...of 循环才会继续执行下一次迭代，处理下一个分片文件。

- 如果中途某个分片处理出错（Promise reject 了），await 会抛出错误，循环也会因此中断（除非有 try...catch 来处理这个错误并决定是否继续）。

总结一下就是：

await 关键字结合 Promise，将原本可能是并发执行的多个异步操作（每个分片的 pipe），强制变成了串行执行。这确保了：

- 第 0 个分片必须完全写入到目标文件后。

- 才会开始处理第 1 个分片，并等待它完全写入。

- 然后才会开始处理第 2 个分片，以此类推。

这正是实现分片文件按正确顺序合并的关键所在。



## 删除chunk

```typescript
    // ... (for...of 循环，用于合并所有分片，已成功结束) ...

    // 所有分片处理完后，删除分片目录
    await new Promise<void>((resolve) => {
      // 1. 创建并等待一个新的 Promise
      fs.rm(chunkDir, { recursive: true }, (err) => {
        // 2. 异步删除目录
        if (err) {
          // 3. 处理删除时可能发生的错误
          console.error(`Failed to remove chunk directory: ${err}`);
        }
        resolve(); // 4. 无论成功或失败（在当前设计下），都解决 Promise
      });
    });
```



1. await new Promise<void>((resolve) => { ... });

- 位置：这段代码紧跟在 for...of 循环之后。由于 for...of 循环中对每个分片的 pipe 操作都使用了 await，所以程序执行到这里时，可以保证所有分片文件都已经成功地、按顺序地合并到了最终的 finalFilePath 文件中。

- 目的：我们希望在确认所有分片都合并完毕之后，再执行删除分片目录的操作。同样，我们希望这个删除操作完成后，再向客户端返回 "merged successfully" 的消息。

- new Promise<void>((resolve) => { ... }):

- 我们又创建了一个新的 Promise。Promise 是处理异步操作的常用方式。<void> 表示这个 Promise 成功解决时不会返回任何特定的值。

- 这个 Promise 包装了 fs.rm 这个异步的删除操作。

- await: await 关键字会暂停 merge 函数的执行，直到这个新创建的 Promise 被解决 (resolve()被调用)。这意味着，服务器不会立即返回成功消息，而是会等待删除目录的操作（或者至少是删除尝试）结束。

2. fs.rm(chunkDir, { recursive: true }, (err) => { ... });

- fs.rm(path, options, callback): 这是 Node.js 文件系统模块中用于删除文件或目录的异步函数。

- chunkDir: 这是之前定义的分片存储目录的路径 (例如 uploads/chunks_myphoto.jpg)，我们现在要删除它。

- { recursive: true }: 这是一个非常重要的选项。

- recursive: true (递归)：告诉 fs.rm 如果 chunkDir 是一个目录并且里面包含文件或其他子目录（在这个场景下，它包含了所有的分片文件），也要一并删除它们。如果没有这个选项，尝试删除一个非空目录会失败。

- 在旧版本的 Node.js 中，删除非空目录可能需要 fs.rmdir(path, { recursive: true }) 或者需要先手动删除目录下的所有文件。fs.rm 是较新版本中推荐的统一接口。

- (err) => { ... }: 这是回调函数。因为 fs.rm 是异步的，它不会立即完成删除。当删除操作结束（无论是成功还是失败）时，Node.js 会调用这个回调函数。

- err: 如果删除过程中发生错误，err 参数会是一个错误对象；如果删除成功，err 会是 null 或 undefined。

3. if (err) { console.error(Failed to remove chunk directory: ${err}); }

- 在回调函数内部，我们首先检查 err 参数。

- 如果 err 存在（即删除操作失败了），我们会通过 console.error 在服务器端打印一条错误日志，记录下删除失败的信息。这有助于调试。

4. resolve();

- 关键点：无论 fs.rm 操作是否成功（即无论 err 是否存在），我们都在回调函数的最后调用了 resolve()。

- resolve() 的作用：调用它会使包裹 fs.rm 的那个 Promise 变为 "resolved" (已解决) 状态。

- 设计决策：这里的逻辑是，即使删除临时分片目录失败了，我们仍然认为主要的文件合并操作是成功的。主要目标（合并文件）已经达成，删除临时文件是一个清理步骤，它的失败不应该阻止服务器告诉客户端文件已成功合并。

- 因此，await 等待的这个 Promise 会在删除尝试结束后（无论结果如何）解决，然后 merge 函数会继续执行。

- 如果你希望删除分片目录的失败也导致整个 merge 操作被视为失败，那么在 if (err) 的情况下，你应该调用 reject(err) 而不是 resolve()。但当前代码的设计是容忍删除失败的。

5. return { message: ${name} merged successfully. };

- 当删除分片目录的 Promise 解决后，await 结束等待。

- 程序执行到这一行，向客户端返回一个 JSON 对象，告知以 name 命名的文件已成功合并。

总结一下这个串行流程：

1. 准备工作：获取分片列表、排序、删除可能已存在的旧的合并后文件。

2. 串行合并分片：

- 进入 for...of 循环。

- 对于第一个分片：创建读写流 -> await 其 pipe 操作完成（即第一个分片内容完全写入最终文件）。

- 对于第二个分片：创建读写流 -> await 其 pipe 操作完成。

- ... 以此类推，直到所有分片都按顺序合并完毕。

3. 串行删除分片目录：

- 所有分片合并完成后，执行删除分片目录的逻辑。

- await 等待删除操作（或删除尝试）完成。即使删除失败，也继续。

4. 返回成功响应：向客户端报告整个合并过程成功。

这种方式确保了操作的顺序性和原子性（相对于主要合并任务而言），并且对清理步骤的失败具有一定的容错性。







