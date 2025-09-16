import { AppDataSource } from "./data-source"
import { Article } from "./entity/Article"
import { Tag } from "./entity/Tag";

AppDataSource.initialize().then(async () => {

  /*   const a1 = new Article();
    a1.title = 'aaaa';
    a1.content = 'aaaaaaaaaa';
  
    const a2 = new Article();
    a2.title = 'bbbbbb';
    a2.content = 'bbbbbbbbbb';
  
    const t1 = new Tag();
    t1.name = 'ttt1111';
  
    const t2 = new Tag();
    t2.name = 'ttt2222';
  
    const t3 = new Tag();
    t3.name = 'ttt33333';
  
    a1.tags = [t1, t2];
    a2.tags = [t1, t2, t3];
   */
  await AppDataSource.manager.transaction(async manager => {
    // 1. 准备标签数据
    const tagNames = ['JavaScript', 'python', 'Node.js', 'React'];

    const tagMap = new Map<string, Tag>();

    // 2.查找或者创建标签
    for (const tagName of tagNames) {
      let tag = await manager.findOne(Tag, {
        where: { name: tagName }
      })
      if (!tag) {
        tag = new Tag()
        tag.name = tagName
        tag = await manager.save(Tag, tag)
        console.log(`✅ 标签 "${tagName}" 创建成功, ID: ${tag.id}`);
      } else {
        console.log(`📋 标签 "${tagName}" 已存在, ID: ${tag.id}`);
      }
      tagMap.set(tagName, tag);
    }
    // 3. 准备文章数据
    const articleData = [
      {
        title: 'JavaScript 基础教程',
        content: 'JavaScript 是一门强大的编程语言...',
        tagNames: ['JavaScript', 'Node.js']
      },
      {
        title: 'TypeScript 进阶指南',
        content: 'TypeScript 为 JavaScript 添加了类型系统...',
        tagNames: ['TypeScript', 'python']
      },
      {
        title: 'React 开发实践',
        content: 'React 是一个用于构建用户界面的库...',
        tagNames: ['React', 'JavaScript', 'TypeScript']
      }
    ];

    // 4. 处理文章和标签的多对多关系
    for (const articleInfo of articleData) {
      let article = await manager.findOne(Article, {
        where: { title: articleInfo.title },
        relations: ['tags']  // 👈 重要：加载现有的标签关系
      })

      if (!article) {
        article = new Article();
        article.title = articleInfo.title;
        article.content = articleInfo.content;
        // 关联标签
        article.tags = articleInfo.tagNames.map(tagName => tagMap.get(tagName));


        article = await manager.save(Article, article);
        console.log(`✅ 文章 "${articleInfo.title}" 创建成功, ID: ${article.id}`);
      } else {
        console.log(`📋 文章 "${articleInfo.title}" 已存在, ID: ${article.id}`);
      }
      // 检查和更新标签关系
      const currentTagNames = new Set(article.tags?.map(tag => tag.name) || [])
      const expectedTagNames = new Set(articleInfo.tagNames)

      // 检查是否需要更新
      const needsUpdate =
        currentTagNames.size !== expectedTagNames.size || ![...expectedTagNames].every(name => currentTagNames.has(name))


      if (needsUpdate) {
        article.tags = articleInfo.tagNames.map(tagName => tagMap.get(tagName));
        article = await manager.save(Article, article);
        console.log(`✅ 文章 "${articleInfo.title}" 标签更新成功, ID: ${article.id}`);
      } else {
        console.log(`📋 文章 "${articleInfo.title}" 标签无需更新, ID: ${article.id}`);
      }
    }

    console.log("\n=== 处理完成 ===");

  })

  // 查询所有标签及其关联的文章（需要在 Tag 实体中添加反向关系）
  console.log("\n=== 从标签角度查看关联 ===");
  const tagRespository = AppDataSource.getRepository(Tag);
  const tags = await tagRespository.createQueryBuilder('tag')
    .leftJoinAndSelect('tag.articles', 'article')
    .getMany();
  console.log(tags);

  tags.forEach(tag => {
    console.log(`\n🏷️  标签: ${tag.name} (ID: ${tag.id})`);

  })

}).catch(error => console.log(error))
