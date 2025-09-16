import { In, QueryBuilder } from "typeorm"
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
AppDataSource.initialize().then(async () => {

  console.log("Inserting a new user into the database...")
  // const user = new User()
  /*   user.id = 1;
    user.firstName = "aaa111"
    user.lastName = "bbb"
    user.age = 25
    await AppDataSource.manager.save(user) */
  // 批量新增
  /*   await AppDataSource.manager.save(User, [
      { firstName: 'ccc', lastName: 'ccc', age: 21 },
      { firstName: 'ddd', lastName: 'ddd', age: 22 },
      { firstName: 'eee', lastName: 'eee', age: 23 }
    ]); */
  // 批量修改
  /*   await AppDataSource.manager.save(User, [
      { id: 2, firstName: 'ccc111', lastName: 'ccc', age: 21 },
      { id: 3, firstName: 'ddd222', lastName: 'ddd', age: 22 },
      { id: 4, firstName: 'eee333', lastName: 'eee', age: 23 }
    ]); */
  /*   // delete删除和批量删除
    await AppDataSource.manager.delete(User, 1)
    await AppDataSource.manager.delete(User, [2, 3])
    console.log("Saved a new user with id: " + user.id)
  
    // remove删除法
    await AppDataSource.manager.remove(User, user)
   */
  /* 
    await AppDataSource.manager.save(User, [
      { firstName: 'ccc', lastName: 'ccc', age: 21 },
      { firstName: 'ddd', lastName: 'ddd', age: 22 },
      { firstName: 'eee', lastName: 'eee', age: 23 }
    ]);
  
    // 正常查询所有数据
    console.log("Loading users from the database...")
    const users = await AppDataSource.manager.find(User)
    console.log("Loaded users: ", users) */

  // findBy条件查询
  /*   const users = await AppDataSource.manager.findBy(User, {
      age: 23
    }) */

  // findAndCount来获取数量
  /*   const [users, count] = await AppDataSource.manager.findAndCount(User)
    console.log("Loaded users: ", users)
    console.log("Loaded count: ", count)
  }).catch(error => console.log(error)) */


  // 多级查询法
  /*   const user = await AppDataSource.manager.find(User, {
      select: {
        firstName: true,
        age: true
      },
      where: {
        id: In([4, 5, 6])
      },
      order: {
        age: "ASC"
      }
    }) */
  // findOneOrFail可以实现抛出异常
  /*   try {
      const user = await AppDataSource.manager.findOneOrFail(User, {
        select: {
          firstName: true,
          age: true
        },
        where: {
          id: In([188])
        },
        order: {
          age: "ASC"
        }
  
  
      })
      console.log('user', user);
  
    } catch (error) {
      console.log('没找到用户');
  
      console.log('error', error);
    } */

  // query执行语句，看看就好，一般不这么用的
  // const users = await AppDataSource.manager.query('select * from user where age in(?, ?)', [21, 22]);

  const queryBuilder = AppDataSource.createQueryBuilder()

  // queryBuilder用于多表联查的复杂场景
  /*   const user = await queryBuilder.select("user")
      .from(User, "user")
      .where("user.age=:age", { age: 21 })
      .getOne() */

  // 构建查询：查找发帖数量超过2的活跃用户
  /*   const query = queryBuilder
      .select('user.name', 'name')                    // 选择用户名，别名为 name
      .addSelect('COUNT(post.id)', 'count')           // 添加帖子计数，别名为 count
      .from(User, 'user')                             // 主表：user，别名 user
      .leftJoin(Post, 'post', 'post.userId = user.id') // 左连接 post 表
      .where('user.id = :id')                         // 条件：特定用户ID
      .andWhere('post.isActive = :isActive')          // 条件：只统计活跃帖子
      .setParameters({ id: 1, isActive: true })       // 设置参数值
      .groupBy('user.name')                           // 按用户名分组
      .having('COUNT(post.id) > :postCount', { postCount: 2 }) // 分组后筛选：帖子数 > 2
  
    // 执行查询
    const results = await query.getRawMany()
    console.log("查询结果:", results)
  
    // 其他常用的 QueryBuilder 方法示例
    console.log("\n=== 其他查询示例 ===")
  
    // 1. 简单查询：获取所有活跃帖子
    const activePosts = await AppDataSource.createQueryBuilder()
      .select("post")
      .from(Post, "post")
      .where("post.isActive = :isActive", { isActive: true })
      .getMany()
    console.log("活跃帖子数量:", activePosts.length)
  
    // 2. 连接查询：获取用户及其帖子
    const usersWithPosts = await AppDataSource.createQueryBuilder()
      .select(["user.id", "user.name", "post.title", "post.isActive"])
      .from(User, "user")
      .leftJoin("user.posts", "post")
      .where("user.id = :userId", { userId: 1 })
      .getRawMany()
    console.log("用户及其帖子:", usersWithPosts)
  
    // 3. 聚合查询：统计每个用户的帖子数
    const userPostCounts = await AppDataSource.createQueryBuilder()
      .select("user.name", "userName")
      .addSelect("COUNT(post.id)", "postCount")
      .from(User, "user")
      .leftJoin("user.posts", "post")
      .groupBy("user.id, user.name")
      .getRawMany()
    console.log("用户帖子统计:", userPostCounts)
  
    // 4. 复杂条件：查找最近一周的帖子
    const recentPosts = await AppDataSource.createQueryBuilder()
      .select("post")
      .from(Post, "post")
      .where("post.createdAt >= :weekAgo", {
        weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      })
      .orderBy("post.createdAt", "DESC")
      .limit(10)
      .getMany()
    console.log("最近的帖子:", recentPosts.length) */


  // 事务查询法
  await AppDataSource.manager.transaction(async manager => {
    await manager.save(User, {
      id: 4,
      firstName: 'eee',
      lastName: 'eee',
    })
  })

}).catch(error => console.log("错误:", error))