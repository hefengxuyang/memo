# Memo 设计文档

## Overview

Memo 是一个基于 Golang 和 SQLite 的任务管理系统。系统采用 RESTful API 架构，提供完整的 CRUD 操作来管理待办任务。

核心功能包括：
- 创建、删除、更新和查询任务
- 任务完成状态管理
- 基于 SQLite 的数据持久化
- JSON 格式的 API 通信

系统设计遵循简洁性原则，使用标准的 HTTP 方法和状态码，确保 API 易于理解和使用。

## Architecture

系统采用三层架构设计：

```
┌─────────────────┐
│   HTTP Client   │
└────────┬────────┘
         │ HTTP/JSON
         ▼
┌─────────────────┐
│   API Layer     │  (HTTP Handlers + Routing)
│   - Validation  │
│   - Serialization│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Layer   │  (Business Logic)
│   - Task CRUD   │
│   - Status Mgmt │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Repository Layer│  (Data Access)
│   - SQLite ORM  │
│   - Queries     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQLite Database│
└─────────────────┘
```

### 架构层次说明

1. **API Layer**: 处理 HTTP 请求和响应，负责路由、请求验证和 JSON 序列化
2. **Service Layer**: 实现业务逻辑，协调数据访问和业务规则
3. **Repository Layer**: 封装数据库操作，提供数据访问接口
4. **Database**: SQLite 数据库，持久化存储任务数据

### 技术栈

- **语言**: Go 1.21+
- **Web 框架**: 使用标准库 `net/http` 或轻量级框架如 `chi` 或 `gin`
- **数据库**: SQLite 3
- **ORM**: `gorm` 或 `sqlx`
- **JSON 处理**: 标准库 `encoding/json`

## Components and Interfaces

### 1. HTTP Handler 组件

负责处理 HTTP 请求和响应。

```go
type TaskHandler struct {
    service TaskService
}

// CreateTask 创建新任务
// POST /api/tasks
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request)

// GetTask 获取单个任务
// GET /api/tasks/{id}
func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request)

// ListTasks 获取所有任务
// GET /api/tasks
func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request)

// UpdateTaskStatus 更新任务状态
// PATCH /api/tasks/{id}/status
func (h *TaskHandler) UpdateTaskStatus(w http.ResponseWriter, r *http.Request)

// DeleteTask 删除任务
// DELETE /api/tasks/{id}
func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request)
```

### 2. Service 组件

实现业务逻辑。

```go
type TaskService interface {
    CreateTask(ctx context.Context, req CreateTaskRequest) (*Task, error)
    GetTask(ctx context.Context, id int64) (*Task, error)
    ListTasks(ctx context.Context) ([]*Task, error)
    UpdateTaskStatus(ctx context.Context, id int64, completed bool) (*Task, error)
    DeleteTask(ctx context.Context, id int64) error
}

type taskService struct {
    repo TaskRepository
}
```

### 3. Repository 组件

封装数据库操作。

```go
type TaskRepository interface {
    Create(ctx context.Context, task *Task) error
    FindByID(ctx context.Context, id int64) (*Task, error)
    FindAll(ctx context.Context) ([]*Task, error)
    Update(ctx context.Context, task *Task) error
    Delete(ctx context.Context, id int64) error
}

type sqliteRepository struct {
    db *sql.DB
}
```

### 4. 路由配置

```go
func SetupRoutes(handler *TaskHandler) http.Handler {
    mux := http.NewServeMux()
    
    mux.HandleFunc("POST /api/tasks", handler.CreateTask)
    mux.HandleFunc("GET /api/tasks/{id}", handler.GetTask)
    mux.HandleFunc("GET /api/tasks", handler.ListTasks)
    mux.HandleFunc("PATCH /api/tasks/{id}/status", handler.UpdateTaskStatus)
    mux.HandleFunc("DELETE /api/tasks/{id}", handler.DeleteTask)
    
    return mux
}
```

## Data Models

### Task 实体

```go
type Task struct {
    ID          int64     `json:"id" db:"id"`
    Title       string    `json:"title" db:"title"`
    Description string    `json:"description" db:"description"`
    Completed   bool      `json:"completed" db:"completed"`
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
}
```

### 数据库 Schema

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

### API 请求/响应模型

```go
// CreateTaskRequest 创建任务请求
type CreateTaskRequest struct {
    Title       string `json:"title"`
    Description string `json:"description"`
}

// UpdateTaskStatusRequest 更新任务状态请求
type UpdateTaskStatusRequest struct {
    Completed bool `json:"completed"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
    Error   string `json:"error"`
    Message string `json:"message"`
}

// TaskResponse 任务响应
type TaskResponse struct {
    Data *Task `json:"data"`
}

// TaskListResponse 任务列表响应
type TaskListResponse struct {
    Data []*Task `json:"data"`
}
```

### 数据验证规则

- `Title`: 必填，非空字符串，去除首尾空格后长度 > 0
- `Description`: 可选，字符串
- `Completed`: 布尔值
- `ID`: 正整数


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task creation round-trip

*For any* valid task data (non-empty title and description), creating a task and then retrieving it by the returned ID should return a task with the same title, description, and initial completed status (false).

**Validates: Requirements 1.1, 1.2, 1.3, 5.1**

### Property 2: Task structure completeness

*For any* created task, the returned task object should contain all required fields: ID (positive integer), title (non-empty string), description (string), completed (boolean), and created_at (valid timestamp).

**Validates: Requirements 1.2, 4.3**

### Property 3: Empty title rejection

*For any* string composed entirely of whitespace characters (including empty string), attempting to create a task with that title should be rejected with an error response, and no task should be created in the database.

**Validates: Requirements 1.4, 7.2**

### Property 4: Task ID uniqueness

*For any* sequence of task creation operations, all returned task IDs should be unique (no duplicates).

**Validates: Requirements 1.5, 6.5**

### Property 5: Task deletion removes task

*For any* existing task, after successfully deleting it, attempting to retrieve that task by ID should return a "not found" error.

**Validates: Requirements 2.1, 2.2**

### Property 6: Delete non-existent task returns error

*For any* task ID that does not exist in the database, attempting to delete it should return an error response with appropriate error message.

**Validates: Requirements 2.3, 5.3**

### Property 7: Task status update round-trip

*For any* existing task and any boolean value (true or false), updating the task's completion status and then retrieving the task should return the task with the updated status value.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 8: Update non-existent task returns error

*For any* task ID that does not exist in the database, attempting to update its status should return an error response with appropriate error message.

**Validates: Requirements 3.5**

### Property 9: List tasks returns all created tasks

*For any* set of created tasks, querying the task list should return all tasks that were created and not deleted, with each task containing complete information.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 10: JSON serialization round-trip

*For any* valid task object, serializing it to JSON and deserializing back should produce an equivalent task object with all fields preserved.

**Validates: Requirements 8.2**

### Property 11: Database errors return descriptive messages

*For any* database operation failure (simulated or real), the API response should contain a descriptive error message and appropriate HTTP status code.

**Validates: Requirements 6.4, 7.1, 7.4**

### Property 12: Invalid parameters return validation errors

*For any* API request with invalid parameters (wrong types, missing required fields, invalid values), the API should return a validation error response with appropriate HTTP status code (400).

**Validates: Requirements 7.2, 7.4**

## Error Handling

### Error Types and HTTP Status Codes

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| Validation Error | 400 Bad Request | Invalid input parameters (empty title, invalid JSON) |
| Not Found | 404 Not Found | Task ID does not exist |
| Database Error | 500 Internal Server Error | Database operation failure |
| Service Unavailable | 503 Service Unavailable | Database connection failure |

### Error Response Format

所有错误响应使用统一格式：

```json
{
  "error": "error_type",
  "message": "Human-readable error description"
}
```

### Error Handling Strategy

1. **输入验证**: 在 Handler 层进行参数验证，返回 400 错误
2. **业务逻辑错误**: 在 Service 层处理，返回适当的错误类型
3. **数据库错误**: 在 Repository 层捕获，包装为自定义错误类型
4. **错误日志**: 所有 500 级别错误记录详细日志
5. **错误传播**: 使用 Go 的 error 接口，保持错误上下文

### 具体错误场景

1. **空标题**: 返回 400，消息 "title cannot be empty"
2. **任务不存在**: 返回 404，消息 "task not found"
3. **无效 JSON**: 返回 400，消息 "invalid JSON format"
4. **数据库连接失败**: 返回 503，消息 "service temporarily unavailable"
5. **数据库操作失败**: 返回 500，消息 "internal server error"

## Testing Strategy

### 测试方法

系统采用双重测试策略，结合单元测试和基于属性的测试（Property-Based Testing）：

- **单元测试**: 验证特定示例、边界情况和错误条件
- **属性测试**: 验证跨所有输入的通用属性

两种测试方法互补，共同确保全面覆盖：
- 单元测试捕获具体的 bug 和边界情况
- 属性测试验证通用正确性并发现意外的边界情况

### 属性测试配置

**测试库**: 使用 `gopter` (Go Property Testing) 库进行属性测试

**配置要求**:
- 每个属性测试最少运行 100 次迭代（由于随机化）
- 每个测试必须引用设计文档中的属性
- 标签格式: `// Feature: memo, Property {number}: {property_text}`

**示例属性测试**:

```go
// Feature: memo, Property 1: Task creation round-trip
func TestProperty_TaskCreationRoundTrip(t *testing.T) {
    properties := gopter.NewProperties(nil)
    
    properties.Property("creating and retrieving task preserves data", 
        prop.ForAll(
            func(title string, desc string) bool {
                // title is non-empty after trimming
                title = strings.TrimSpace(title)
                if title == "" {
                    return true // skip invalid input
                }
                
                // Create task
                task, err := service.CreateTask(ctx, CreateTaskRequest{
                    Title: title,
                    Description: desc,
                })
                if err != nil {
                    return false
                }
                
                // Retrieve task
                retrieved, err := service.GetTask(ctx, task.ID)
                if err != nil {
                    return false
                }
                
                // Verify data matches
                return retrieved.Title == title &&
                       retrieved.Description == desc &&
                       retrieved.Completed == false
            },
            gen.AnyString(),
            gen.AnyString(),
        ))
    
    properties.TestingRun(t, gopter.ConsoleReporter(false))
}
```

### 单元测试重点

单元测试应专注于：

1. **具体示例**: 演示正确行为的典型用例
2. **边界情况**: 
   - 空数据库查询
   - 删除最后一个任务
   - 连续状态切换
3. **错误条件**:
   - 空标题验证
   - 不存在的任务 ID
   - 无效 JSON 格式
   - 数据库连接失败
4. **集成点**:
   - HTTP 路由正确性
   - JSON 序列化/反序列化
   - 数据库初始化和关闭

### 测试覆盖目标

- **代码覆盖率**: 目标 80%+
- **API 端点**: 100% 覆盖所有端点
- **错误路径**: 覆盖所有定义的错误类型
- **属性测试**: 实现所有 12 个设计属性

### 测试数据生成

属性测试使用 `gopter` 的生成器：

```go
// 生成有效的任务标题（非空）
func genValidTitle() gopter.Gen {
    return gen.AnyString().SuchThat(func(s string) bool {
        return strings.TrimSpace(s) != ""
    })
}

// 生成任务描述
func genDescription() gopter.Gen {
    return gen.AnyString()
}

// 生成完成状态
func genCompleted() gopter.Gen {
    return gen.Bool()
}
```

### 测试环境

- **单元测试**: 使用内存 SQLite 数据库 (`:memory:`)
- **集成测试**: 使用临时文件数据库，测试后清理
- **并发测试**: 验证并发请求的正确性
- **性能测试**: 基准测试关键操作（创建、查询、更新）

### CI/CD 集成

- 所有测试在 PR 时自动运行
- 属性测试使用固定种子以确保可重现性
- 测试失败时保存失败的随机输入用于调试
