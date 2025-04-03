import { Inject, Injectable } from '@nestjs/common';
import { DbModuleOptions } from './db.module';
import { access, readFile, writeFile } from 'fs/promises';

@Injectable()
export class DbService {
  @Inject('OPTIONS')
  private options: DbModuleOptions;

  async read() {
    // 获取db.module.ts传入的动态配置
    const filePath = this.options.path;
    try {
      // 如果文件不存在，则返回空数组
      await access(filePath);
    } catch (_) {
      // Ignore error
      return [];
    }

    const str = await readFile(filePath, {
      encoding: 'utf-8',
    });

    if (!str) {
      return [];
    }

    return JSON.parse(str) as Record<string, any>[];
  }

  async write(obj: Record<string, any>[]) {
    const uniqueObj = Array.from(
      new Map(
        obj.map((item) => [item.id, item] as [number, typeof item]),
      ).values(),
    );
    await writeFile(
      this.options.path,
      JSON.stringify(uniqueObj || [], null, 2),
      {
        encoding: 'utf-8',
      },
    );
  }
}
