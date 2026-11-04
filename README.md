# MEMO

没有手搓代码，完全使用 AI 工具 KIRO 实现的备忘录

## SETUP

前端启动：
```
cd {project}/web

// 安装依赖
npm install

// 启动web服务
npm run serve
```

后端启动：
（数据库为本地的SQLite，无需安装）
```
// 下载依赖库文件
go mod tidy

// 编译
go build -o memo cmd/main.go 2>&1

// 执行
./memo config.json
```
