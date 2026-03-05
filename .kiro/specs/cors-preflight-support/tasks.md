# Implementation Plan: CORS Preflight Support

## Overview

本实现计划将为 Memo 后端添加 CORS（跨域资源共享）预检请求支持。实现采用中间件方式，集成到现有的 chi 路由器中间件链中。中间件将拦截 OPTIONS 预检请求并返回适当的 CORS 响应头，同时为所有其他请求添加必要的 CORS 响应头，使前端能够成功进行跨域 API 调用。

## Tasks

- [x] 1. 扩展配置模块以支持 CORS 配置
  - 在 `internal/config/config.go` 中添加 `CORSConfig` 结构体
  - 添加从环境变量 `CORS_ALLOWED_ORIGINS` 读取配置的逻辑
  - 实现 `ParseAllowedOrigins()` 方法解析逗号分隔的源列表
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2. 实现 CORS 中间件核心功能
  - [x] 2.1 创建 CORS 中间件文件和基础结构
    - 创建 `internal/middleware/cors.go` 文件
    - 定义 `CORSConfig` 结构体，包含 AllowedOrigins、AllowedMethods、AllowedHeaders、MaxAge、AllowCredentials 字段
    - 实现 `NewCORSMiddleware(config CORSConfig)` 函数返回 chi 兼容的中间件
    - _Requirements: 3.1, 3.2_

  - [x] 2.2 实现 OPTIONS 预检请求处理逻辑
    - 在中间件中检测 OPTIONS 方法
    - 设置 Access-Control-Allow-Methods 头（值为 "GET, POST, PATCH, DELETE, OPTIONS"）
    - 设置 Access-Control-Allow-Headers 头（值为 "Content-Type, Accept"）
    - 设置 Access-Control-Max-Age 头（值为 "3600"）
    - 返回 204 No Content 状态码并终止请求处理
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.3_

  - [x] 2.3 实现常规请求的 CORS 响应头设置
    - 实现 `isOriginAllowed()` 方法检查源是否在允许列表中
    - 根据请求的 Origin 头设置 Access-Control-Allow-Origin（匹配请求源或 "*"）
    - 设置 Access-Control-Allow-Credentials 头为 "true"
    - 处理缺失或格式错误的 Origin 头（不抛出错误，继续处理）
    - 将请求转发到下游处理器
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.4, 4.2, 4.4, 5.1_

  - [ ]* 2.4 编写 CORS 中间件单元测试
    - 测试 OPTIONS 请求返回 204 和所有预检头
    - 测试不同 HTTP 方法的请求包含 CORS 头
    - 测试允许源列表过滤逻辑
    - 测试边界情况（缺失 Origin、格式错误的 Origin）
    - 测试中间件不覆盖下游响应头
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 4.2, 4.4, 5.2_

  - [ ]* 2.5 编写属性测试 - Property 1: OPTIONS 请求返回完整的预检响应
    - **Property 1: OPTIONS 请求返回完整的预检响应**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - 使用 gopter 生成随机路径和 Origin
    - 验证所有 OPTIONS 请求返回 204 状态码和所有必需的预检头

  - [ ]* 2.6 编写属性测试 - Property 2 和 3: 响应头验证
    - **Property 2: 所有响应包含 Allow-Origin 头**
    - **Property 3: 所有响应包含 Allow-Credentials 头**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - 生成随机 HTTP 方法、路径和 Origin
    - 验证响应包含正确的 CORS 头

  - [ ] 2.7 编写属性测试 - Property 4 和 5: 请求转发行为
    - **Property 4: OPTIONS 请求不会到达路由处理器**
    - **Property 5: 非 OPTIONS 请求正常转发**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - 使用计数器验证 OPTIONS 请求被拦截
    - 验证其他请求正常转发到下游处理器

  - [ ]* 2.8 编写属性测试 - Property 6 和 7: 源过滤和响应头保护
    - **Property 6: 允许源列表过滤**
    - **Property 7: 中间件不覆盖下游响应头**
    - **Validates: Requirements 4.2, 4.4, 5.2**
    - 生成随机允许源列表和请求源
    - 验证源过滤逻辑和响应头保护

- [ ] 3. 集成 CORS 中间件到路由系统
  - [x] 3.1 修改路由设置函数
    - 修改 `internal/handler/routes.go` 中的 `SetupRoutes` 函数签名，添加 `corsConfig` 参数
    - 在中间件链最前端注册 CORS 中间件（在 Logger 之前）
    - 确保中间件顺序：CORS -> Logger -> Recoverer -> RequestID -> RealIP -> Router
    - _Requirements: 3.1, 3.2_

  - [ ]* 3.2 编写路由集成测试
    - 测试 CORS 中间件与现有中间件链的兼容性
    - 端到端测试：从 HTTP 请求到响应的完整流程
    - 验证 CORS 头在实际 API 端点上正确设置
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. 更新主程序以加载和使用 CORS 配置
  - 修改 `cmd/main.go`，从配置中读取 CORS 设置
  - 创建 `middleware.CORSConfig` 实例，设置 AllowedOrigins、AllowedMethods、AllowedHeaders、MaxAge、AllowCredentials
  - 将 CORS 配置传递给 `handler.SetupRoutes()` 函数
  - _Requirements: 4.1, 4.3_

- [x] 5. Checkpoint - 确保所有测试通过
  - 运行所有单元测试和属性测试
  - 验证 CORS 中间件功能正常
  - 确保没有引入回归问题
  - 如有问题请询问用户

- [x] 6. 添加错误处理和日志记录
  - 在 CORS 中间件中添加 panic 恢复机制
  - 添加调试级别日志记录每个请求的 Origin 和是否被允许
  - 添加警告级别日志记录格式错误的 Origin 头
  - 添加错误级别日志记录中间件内部错误
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 7. Final checkpoint - 完整功能验证
  - 运行所有测试确保通过
  - 验证所有需求都已实现
  - 确认 CORS 中间件与现有系统无缝集成
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选任务，可跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号以确保可追溯性
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界情况
- CORS 中间件必须位于中间件链最前端以确保所有请求都经过处理
