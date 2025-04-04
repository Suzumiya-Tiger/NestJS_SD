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
  async list(name?: string) {
    const books = (await this.dbService.read()) as Book[];
    if (name) {
      const filterBooks = books.filter((book) => book.name.includes(name));
      if (filterBooks.length) {
        return filterBooks;
      }
      throw new NotFoundException('图书不存在');
    }
    return books;
  }

  async findById(id: number) {
    const books = (await this.dbService.read()) as Book[];
    const result = books.find((book) => book.id === id);
    return result;
  }

  async create(createBookDto: CreateBookDto) {
    const books = (await this.dbService.read()) as Book[];
    const book = new Book();
    const foundBook = books.find((book) => book.name === createBookDto.name);
    if (foundBook) {
      throw new BadRequestException('图书已存在');
    }
    book.id = randomNum();
    book.author = createBookDto.author;
    book.name = createBookDto.name;
    book.description = createBookDto.description;
    book.cover = createBookDto.cover;

    books.push(book);
    await this.dbService.write(books);
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const books = (await this.dbService.read()) as Book[];
    const foundBook = books.find((book) => book.id === id);
    console.log('foundBook', foundBook);

    if (!foundBook) {
      throw new NotFoundException('图书不存在');
    }
    foundBook.name = updateBookDto.name ?? foundBook.name;
    foundBook.author = updateBookDto.author ?? foundBook.author;
    foundBook.description = updateBookDto.description ?? foundBook.description;
    foundBook.cover = updateBookDto.cover ?? foundBook.cover;

    await this.dbService.write(books);
    return foundBook;
  }

  async delete(id: number) {
    const books: Book[] = (await this.dbService.read()) as Book[];
    const index = books.findIndex((item) => item.id === id);
    if (index !== -1) {
      const bookName = books[index].name;
      books.splice(index, 1);
      await this.dbService.write(books);
      return {
        message: `图书${bookName}删除成功`,
      };
    }
    throw new NotFoundException('图书不存在');
  }
}
