import { Department } from './entity/Department';
import { Employee } from './entity/Employee';
import { AppDataSource } from "./data-source"

AppDataSource.initialize().then(async () => {
  console.log("=== 开始数据初始化 ===")

  await AppDataSource.manager.transaction(async manager => {

    // 1. 查找或创建部门
    let dept = await manager.findOne(Department, {
      where: { name: '技术部' }
    });

    if (!dept) {
      dept = new Department();
      dept.name = '技术部';
      dept = await manager.save(Department, dept);
      console.log("✅ 技术部创建成功, ID:", dept.id);
    } else {
      console.log("📋 技术部已存在, ID:", dept.id);
    }

    // 2. 使用 Map 来避免重复
    const employeeNames = ['张三', '李四', '王五'];
    const employeeMap = new Map<string, Employee>();  // 👈 用 Map 避免重复

    for (const name of employeeNames) {
      let employee = await manager.findOne(Employee, {
        where: { name },
        relations: ['department']
      });

      if (!employee) {
        // 创建新员工
        employee = new Employee();
        employee.name = name;
        employee.department = dept;

        employee = await manager.save(Employee, employee);
        console.log(`✅ 员工 ${name} 创建成功, ID: ${employee.id}`);

      } else {
        // 员工已存在，检查部门关联
        if (!employee.department || employee.department.id !== dept.id) {
          employee.department = dept;
          employee = await manager.save(Employee, employee);
          console.log(`🔄 员工 ${name} 的部门关联已更新`);
        } else {
          console.log(`📋 员工 ${name} 已存在且关联正确`);
        }
      }

      // 使用 Map 确保不重复
      employeeMap.set(name, employee);  // 👈 Map 会自动覆盖重复的 key
    }

    // 3. 转换为数组
    const finalEmployees = Array.from(employeeMap.values());

    console.log("\n=== 处理结果 ===");
    console.log(`部门: ${dept.name} (ID: ${dept.id})`);
    console.log(`员工数量: ${finalEmployees.length}`);  // 👈 确保不重复
    finalEmployees.forEach(emp => {
      console.log(`  - ${emp.name} (ID: ${emp.id})`);
    });

    // 4. 可选：更新部门的员工关系（内存中）
    dept.employees = finalEmployees;
  });

  // 验证查询...
  console.log("\n=== 验证关联查询 ===");
  const deps = await AppDataSource.manager.find(Department, {
    relations: ['employees']
  });

  deps.forEach(dept => {
    console.log(`\n部门: ${dept.name} (ID: ${dept.id})`);
    console.log(`员工数量: ${dept.employees?.length || 0}`);
    dept.employees?.forEach(emp => {
      console.log(`  └─ 员工: ${emp.name} (ID: ${emp.id})`);
    });
  });

}).catch(error => {
  console.log("❌ 错误:", error.message);
});
