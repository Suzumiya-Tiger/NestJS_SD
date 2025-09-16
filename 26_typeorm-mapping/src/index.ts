import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { IdCard } from "./entity/IdCard"

AppDataSource.initialize().then(async () => {

  // 检查是否已存在该身份证号码
  const existingIdCard = await AppDataSource.manager.findOne(IdCard, {
    where: { cardNumber: "123456789012345678" }
  })

  if (!existingIdCard) {
    // 先创建 IdCard
    const idCard = new IdCard()

    idCard.cardNumber = "123456789012345678"
    idCard.realName = "Timber Saw"

    // 创建 User 并关联 IdCard
    const user = new User()

    user.firstName = "Timber"
    user.lastName = "Saw"
    user.age = 25

    // 建立关联
    idCard.user = user
    user.idCard = idCard

    // 保存 IdCard（由于配置了级联，User 也会被保存）
    await AppDataSource.manager.save(idCard)
    console.log("Saved user and IdCard")
  } else {
    console.log("IdCard with this number already exists")
  }

  /*   console.log("Loading users from the database...")
    const users = await AppDataSource.manager.find(User)
    console.log("Loaded users: ", users)
  
    // 加载用户及其身份证信息
    console.log("Loading users with IdCard...")
    const usersWithIdCard = await AppDataSource.manager.find(User, {
      relations: ["idCard"]
    })
    console.log("Loaded users with IdCard: ", usersWithIdCard)
   */

  /* 查询方法 */
  // 方案一：使用 relations 查询
  const ics = await AppDataSource.manager.find(IdCard, {
    relations: ["user"]
  });
  // console.log('ics', ics);

  // 方案二：使用query builder查询
  const ics2 = await AppDataSource.manager.getRepository(IdCard)
    .createQueryBuilder("ic")
    .leftJoinAndSelect("ic.user", "u")
    .getMany();

  // console.log(ics2);


  // 删除操作
  await AppDataSource.manager.delete(User, 1)

}).catch(error => console.log(error))
