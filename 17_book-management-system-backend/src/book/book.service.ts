import { UpdateBookDto } from './dto/update-book.dto';
import { CreateBookDto } from './dto/create-book.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Inject } from '@nestjs/common';
import { Book } from './entities/book.entity';
function randomNum() {
  return Math.floor(Math.random() * 1000000);
}
@Injectable()
export class BookService {
  @Inject()
  private dbService: DbService;

  private booksCache: Book[] = [];
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  private async getBooks(): Promise<Book[]> {
    const now = Date.now();
    if (!this.booksCache || now - this.cacheTime > this.CACHE_DURATION) {
      this.booksCache = (await this.dbService.read()) as Book[];
      this.cacheTime = now;
    }
    return this.booksCache;
  }

  // 清空缓存的私有方法
  private clearCache() {
    this.booksCache = [];
    this.cacheTime = 0;
  }

  async list(name?: string) {
    const books = await this.getBooks(); // 使用缓存

    if (name) {
      const filterBooks = books.filter((book) =>
        book.name.toLowerCase().includes(name.toLowerCase()),
      );
      if (filterBooks.length) {
        return filterBooks;
      }
      throw new NotFoundException('图书不存在');
    }
    return books;
  }

  async findById(id: number) {
    const books = await this.getBooks(); // 使用缓存
    const result = books.find((book) => book.id === id);
    if (!result) {
      throw new NotFoundException('图书不存在');
    }
    return result;
  }

  async create(createBookDto: CreateBookDto) {
    const books = await this.getBooks(); // 使用缓存
    const foundBook = books.find((book) => book.name === createBookDto.name);
    if (foundBook) {
      throw new BadRequestException('图书已存在');
    }

    const book = new Book();
    book.id = randomNum();
    book.author = createBookDto.author;
    book.name = createBookDto.name;
    book.description = createBookDto.description;
    book.cover = createBookDto.cover;

    books.push(book);
    await this.dbService.write(books);

    this.clearCache(); // 数据变更后清空缓存
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const books = await this.getBooks(); // 使用缓存
    const foundBook = books.find((book) => book.id === id);

    if (!foundBook) {
      throw new NotFoundException('图书不存在');
    }

    foundBook.name = updateBookDto.name ?? foundBook.name;
    foundBook.author = updateBookDto.author ?? foundBook.author;
    foundBook.description = updateBookDto.description ?? foundBook.description;
    foundBook.cover = updateBookDto.cover ?? foundBook.cover;

    await this.dbService.write(books);
    this.clearCache(); // 数据变更后清空缓存
    return foundBook;
  }

  async delete(id: number) {
    const books = await this.getBooks(); // 使用缓存
    const index = books.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new NotFoundException('图书不存在');
    }

    const bookName = books[index].name;
    books.splice(index, 1);
    await this.dbService.write(books);

    this.clearCache(); // 数据变更后清空缓存
    return {
      message: `图书${bookName}删除成功`,
    };
  }
}

/** 索引优化方案 */
/* 

@Injectable()
export class BookService {
  // 索引：关键词 → 书籍列表
  private nameIndex: Map<string, Book[]> = new Map();
  private indexBuilt = false;

  // 建立索引（只需要做一次）
  private buildIndex(books: Book[]) {
    this.nameIndex.clear();
    
    books.forEach(book => {
      // 把书名拆分成关键词
      const keywords = book.name.toLowerCase().split(' ');
      
      keywords.forEach(keyword => {
        if (!this.nameIndex.has(keyword)) {
          this.nameIndex.set(keyword, []);
        }
        this.nameIndex.get(keyword).push(book);
      });
    });
    
    this.indexBuilt = true;
  }

  async list(name?: string) {
    const books = await this.getBooks();
    
    if (name) {
      // 第一次搜索时建立索引
      if (!this.indexBuilt) {
        this.buildIndex(books);
      }
      
      const searchKeyword = name.toLowerCase();
      const matches = this.nameIndex.get(searchKeyword) || [];
      
      if (matches.length) {
        return matches;
      }
      throw new NotFoundException('图书不存在');
    }
    
    return books;
  }

  // 数据变更时重置索引
  private clearCache() {
    this.booksCache = null;
    this.indexBuilt = false; // 重置索引标记
  }
}

*/
