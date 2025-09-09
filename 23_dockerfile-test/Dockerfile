# build stage
FROM node:18 as build-stage    
# ← 给这个阶段命名
WORKDIR /app
COPY package.json .            
# 先复制 package.json，利用 Docker 层缓存
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install               
# 安装所有依赖（包括开发依赖）
COPY . .                      
# 复制所有源码
RUN npm run build             
# 编译 TypeScript → JavaScript

# production stage
# 使用 Alpine 版本减小镜像
FROM node:18-alpine as production-stage                          
# 全新的镜像
COPY --from=build-stage /app/dist /app                       
# 只复制编译后的代码
COPY --from=build-stage /app/package.json /app/package.json  
# 复制依赖描述
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install --production                                 
# 只安装生产依赖
EXPOSE 3000
CMD ["node", "/app/main.js"]                                
# 直接运行 JS 文件
