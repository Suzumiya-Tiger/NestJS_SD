# NestJS 学习项目 - Git Submodules

这是一个使用 Git Submodules 管理的 NestJS 学习项目集合。每个子项目都有独立的Git仓库，可以单独推送和管理。

## 项目结构

- `01_http_transport_method`: HTTP 传输方法示例
- `02_nest_ioc`: NestJS IoC 容器示例
- `03_debug_test`: 调试测试项目
- `04_custom-provider`: 自定义 Provider 示例
- `05_aop-test`: AOP (面向切面编程) 测试项目
- `06_all-decorator`: 所有装饰器示例

## 初始克隆项目

```bash
# 克隆主项目
git clone <父级仓库URL> nestjs-study-projects

# 进入项目目录
cd nestjs-study-projects

# 初始化并更新所有子模块
git submodule update --init --recursive
```

## 子模块管理

### 添加新子模块

```bash
# 添加一个新的子模块
git submodule add <子项目Git仓库URL> <本地路径>
# 例如
git submodule add https://github.com/yourname/new-module.git 07_new-module
```

### 更新所有子模块

```bash
# 更新所有子模块到各自远程仓库的最新提交
git submodule update --remote --merge
```

### 在子模块中工作

```bash
# 进入子模块目录
cd 05_aop-test

# 正常使用Git命令，就像在独立仓库中一样
git status
git add .
git commit -m "Update features"
git push

# 回到父级项目
cd ..

# 提交子模块的变更到父级项目
git add 05_aop-test
git commit -m "Update 05_aop-test submodule"
git push
```

### 删除子模块

```bash
# 1. 从.gitmodules文件中删除相关部分
git config -f .gitmodules --remove-section submodule.<子模块路径>

# 2. 从.git/config中删除相关部分
git config --remove-section submodule.<子模块路径>

# 3. 移除缓存的子模块
git rm --cached <子模块路径>

# 4. 删除.git中的子模块目录
rm -rf .git/modules/<子模块路径>

# 5. 删除子模块目录
rm -rf <子模块路径>

# 6. 提交更改
git add .
git commit -m "Removed submodule <子模块路径>"
``` 