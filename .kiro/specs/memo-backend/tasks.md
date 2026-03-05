# Implementation Plan: Memo Backend

## Overview

实现一个基于 Golang 和 SQLite 的任务管理系统，采用三层架构（API Layer、Service Layer、Repository Layer），提供完整的 RESTful API 用于任务的 CRUD 操作。系统使用标准库或轻量级框架处理 HTTP 请求，使用 SQLite 进行数据持久化，并通过属性测试和单元测试确保正确性。

## Tasks

- [x] 1. 项目初始化和依赖配置
  - 创建 Go 模块并初始化项目结构
  - 配置 `go.mod` 文件，添加必要依赖（SQLite 驱动、HTTP 路由库、测试库）
  - 创建目录结构：`cmd/`, `internal/handler/`, `internal/service/`, `internal/repository/`, `internal/model/`
  - 添加 `gopter` 属性测试库依赖
  - _Requirements: 6.1, 6.2, 8.1_

- [ ] 2. 实现数据模型和数据库层
  - [x] 2.1 定义核心数据模型
    - 在 `internal/model/` 中创建 `task.go`，定义 `Task` 结构体
    - 定义 API 请求/响应模型：`CreateTaskRequest`, `UpdateTaskStatusRequest`, `ErrorResponse`, `TaskResponse`, `TaskListResponse`
    - 实现数据验证函数（标题非空验证）
    - _Requirements: 1.2, 4.3, 7.2, 8.2_
  
  - [x] 2.2 实现 Repository 接口和 SQLite 实现
    - 在 `internal/repository/` 中创建 `repository.go`，定义 `TaskRepository` 接口
    - 实现 `sqliteRepository` 结构体，包含数据库连接
    - 实现 `Create()` 方法：插入新任务到数据库
    - 实现 `FindByID()` 方法：根据 ID 查询任务
    - 实现 `FindAll()` 方法：查询所有任务
    - 实现 `Update()` 方法：更新任务信息
    - 实现 `Delete()` 方法：删除任务
    - _Requirements: 1.3, 2.2, 3.4, 4.2, 5.2, 6.1_
  
  - [x] 2.3 实现数据库初始化和 Schema 创建
    - 创建数据库初始化函数，执行 CREATE TABLE 语句
    - 创建索引：`idx_tasks_completed` 和 `idx_tasks_created_at`
    - 实现数据库连接管理（打开、关闭、错误处理）
    - 确保 Task_ID 唯一性约束
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 2.4 编写 Repository 层单元测试
    - 测试使用内存数据库 (`:memory:`)
    - 测试 CRUD 操作的正确性
    - 测试错误场景（不存在的 ID、数据库错误）
    - _Requirements: 6.4, 7.1_

- [ ] 3. 实现 Service 层业务逻辑
  - [x] 3.1 定义 Service 接口和实现
    - 在 `internal/service/` 中创建 `service.go`，定义 `TaskService` 接口
    - 实现 `taskService` 结构体，注入 `TaskRepository` 依赖
    - 实现 `CreateTask()` 方法：验证输入，调用 repository 创建任务
    - 实现 `GetTask()` 方法：根据 ID 获取任务，处理不存在的情况
    - 实现 `ListTasks()` 方法：获取所有任务列表
    - 实现 `UpdateTaskStatus()` 方法：更新任务完成状态
    - 实现 `DeleteTask()` 方法：删除任务，处理不存在的情况
    - _Requirements: 1.1, 1.4, 2.1, 2.3, 3.1, 3.2, 3.3, 3.5, 4.1, 5.1, 5.3_
  
  - [x] 3.2 编写 Service 层单元测试
    - 使用 mock repository 进行测试
    - 测试业务逻辑正确性
    - 测试输入验证（空标题拒绝）
    - 测试错误传播和处理
    - _Requirements: 1.4, 2.3, 3.5, 5.3, 7.2_

- [ ] 4. 实现 API Handler 层
  - [x] 4.1 实现 HTTP Handler
    - 在 `internal/handler/` 中创建 `handler.go`，定义 `TaskHandler` 结构体
    - 实现 `CreateTask()` handler：处理 POST /api/tasks
    - 实现 `GetTask()` handler：处理 GET /api/tasks/{id}
    - 实现 `ListTasks()` handler：处理 GET /api/tasks
    - 实现 `UpdateTaskStatus()` handler：处理 PATCH /api/tasks/{id}/status
    - 实现 `DeleteTask()` handler：处理 DELETE /api/tasks/{id}
    - 实现 JSON 序列化/反序列化
    - 实现统一错误响应格式
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 4.2 实现路由配置
    - 创建 `SetupRoutes()` 函数，配置所有 API 路由
    - 使用标准库 `net/http` 或轻量级框架（如 `chi` 或 `gin`）
    - 确保路由与 RESTful 规范一致
    - _Requirements: 8.1_
  
  - [x] 4.3 实现错误处理和 HTTP 状态码映射
    - 实现错误类型到 HTTP 状态码的映射逻辑
    - 400 Bad Request：验证错误、无效 JSON
    - 404 Not Found：任务不存在
    - 500 Internal Server Error：数据库操作失败
    - 503 Service Unavailable：数据库连接失败
    - 实现错误日志记录
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 4.4 编写 Handler 层单元测试
    - 使用 `httptest` 测试 HTTP handlers
    - 测试所有 API 端点的正确响应
    - 测试错误场景和状态码
    - 测试 JSON 序列化/反序列化
    - _Requirements: 8.2, 7.4_

- [x] 5. Checkpoint - 核心功能验证
  - 确保所有核心 CRUD 功能正常工作，运行现有测试，询问用户是否有问题

- [ ] 6. 实现属性测试
  - [x] 6.1 属性测试 1：任务创建往返一致性
    - **Property 1: Task creation round-trip**
    - **Validates: Requirements 1.1, 1.2, 1.3, 5.1**
    - 使用 `gopter` 生成随机标题和描述
    - 验证创建后检索的任务数据一致性
    - 最少 100 次迭代
  
  - [x] 6.2 属性测试 2：任务结构完整性
    - **Property 2: Task structure completeness**
    - **Validates: Requirements 1.2, 4.3**
    - 验证所有创建的任务包含完整字段
    - 验证字段类型正确性
  
  - [x] 6.3 属性测试 3：空标题拒绝
    - **Property 3: Empty title rejection**
    - **Validates: Requirements 1.4, 7.2**
    - 生成各种空白字符串（空字符串、空格、制表符等）
    - 验证所有空标题都被拒绝
  
  - [x] 6.4 属性测试 4：任务 ID 唯一性
    - **Property 4: Task ID uniqueness**
    - **Validates: Requirements 1.5, 6.5**
    - 创建多个任务，验证所有 ID 唯一
  
  - [x] 6.5 属性测试 5：任务删除后不可检索
    - **Property 5: Task deletion removes task**
    - **Validates: Requirements 2.1, 2.2**
    - 创建任务，删除后验证无法检索
  
  - [x] 6.6 属性测试 6：删除不存在的任务返回错误
    - **Property 6: Delete non-existent task returns error**
    - **Validates: Requirements 2.3, 5.3**
    - 使用随机不存在的 ID，验证返回错误
  
  - [x] 6.7 属性测试 7：任务状态更新往返一致性
    - **Property 7: Task status update round-trip**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - 创建任务，更新状态，验证状态正确保存
  
  - [x] 6.8 属性测试 8：更新不存在的任务返回错误
    - **Property 8: Update non-existent task returns error**
    - **Validates: Requirements 3.5**
    - 使用随机不存在的 ID，验证返回错误
  
  - [x] 6.9 属性测试 9：列表查询返回所有任务
    - **Property 9: List tasks returns all created tasks**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - 创建多个任务，验证列表包含所有任务
  
  - [x] 6.10 属性测试 10：JSON 序列化往返一致性
    - **Property 10: JSON serialization round-trip**
    - **Validates: Requirements 8.2**
    - 验证任务对象 JSON 序列化和反序列化的一致性
  
  - [x] 6.11 属性测试 11：数据库错误返回描述性消息
    - **Property 11: Database errors return descriptive messages**
    - **Validates: Requirements 6.4, 7.1, 7.4**
    - 模拟数据库错误，验证错误响应格式
  
  - [x] 6.12 属性测试 12：无效参数返回验证错误
    - **Property 12: Invalid parameters return validation errors**
    - **Validates: Requirements 7.2, 7.4**
    - 生成各种无效输入，验证返回 400 错误

- [x] 7. 实现主程序和服务启动
  - [x] 7.1 创建主程序入口
    - 在 `cmd/` 中创建 `main.go`
    - 初始化数据库连接
    - 创建 repository、service、handler 实例
    - 配置路由
    - 启动 HTTP 服务器
    - 实现优雅关闭（处理信号，关闭数据库连接）
    - _Requirements: 6.2, 6.3_
  
  - [x] 7.2 编写集成测试
    - 使用临时数据库文件进行端到端测试
    - 测试完整的 HTTP 请求流程
    - 测试并发请求的正确性
    - 测试后清理临时文件
    - _Requirements: 所有需求的集成验证_

- [x] 8. 添加配置和文档
  - [x] 8.1 添加配置管理
    - 支持通过环境变量或配置文件设置数据库路径、服务端口等
    - 提供合理的默认值
  
  - [x] 8.2 创建 README 文档
    - 项目介绍和功能说明
    - 安装和运行指南
    - API 接口文档和示例
    - 开发和测试指南

- [ ] 9. Final Checkpoint - 完整性验证
  - 运行所有测试（单元测试、属性测试、集成测试），确保全部通过
  - 验证代码覆盖率达到 80%+
  - 询问用户是否有问题或需要调整

## Notes

- 任务标记 `*` 为可选任务，可跳过以加快 MVP 开发
- 每个任务都引用了具体的需求条款，确保可追溯性
- 属性测试使用 `gopter` 库，每个测试至少运行 100 次迭代
- 单元测试使用内存数据库 (`:memory:`) 以提高测试速度
- 集成测试使用临时文件数据库，测试后自动清理
- Checkpoint 任务确保增量验证，及时发现问题
