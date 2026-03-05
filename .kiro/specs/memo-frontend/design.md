# Design Document: Memo Web Frontend

## Overview

Memo Web Frontend 是一个轻量级、响应式的单页应用（SPA），使用原生 HTML、CSS 和 JavaScript 构建。该应用通过 RESTful API 与现有的 Golang 后端服务集成，提供直观的任务管理界面。

### 设计目标

- **简洁性**: 使用原生 Web 技术，无需复杂的构建工具或框架依赖
- **性能**: 快速加载和响应，优化用户体验
- **可维护性**: 模块化架构，清晰的关注点分离
- **可访问性**: 符合 Web 可访问性标准，支持键盘导航和屏幕阅读器
- **响应式**: 适配桌面和移动设备

### 技术栈选择

**核心技术**:
- **HTML5**: 语义化标记，提供良好的可访问性基础
- **CSS3**: 现代布局（Flexbox/Grid）、CSS 变量、媒体查询实现响应式设计
- **Vanilla JavaScript (ES6+)**: 模块化代码，使用现代 JavaScript 特性

**选择原因**:
1. **零依赖**: 无需框架，减少包大小和复杂性
2. **快速加载**: 没有框架开销，初始加载时间更短
3. **浏览器原生支持**: 利用现代浏览器的原生能力（Fetch API、ES6 模块、Promise）
4. **易于部署**: 静态文件，可部署到任何 Web 服务器或 CDN
5. **学习曲线低**: 标准 Web 技术，易于理解和维护

## Architecture

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Presentation Layer                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │ TaskList │  │ TaskForm │  │ TaskItem         │ │ │
│  │  │Component │  │Component │  │Component         │ │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  │  ┌──────────┐  ┌──────────┐                       │ │
│  │  │ Loading  │  │ Error    │                       │ │
│  │  │Component │  │Component │                       │ │
│  │  └──────────┘  └──────────┘                       │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Application Layer                      │ │
│  │  ┌──────────────────┐  ┌──────────────────┐       │ │
│  │  │   TaskService    │  │   UIController   │       │ │
│  │  │  (Business Logic)│  │  (Event Handling)│       │ │
│  │  └──────────────────┘  └──────────────────┘       │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Data Access Layer                      │ │
│  │  ┌──────────────────┐  ┌──────────────────┐       │ │
│  │  │   APIClient      │  │   StateManager   │       │ │
│  │  │  (HTTP Requests) │  │  (Local State)   │       │ │
│  │  └──────────────────┘  └──────────────────┘       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTP/JSON
                          │
┌─────────────────────────────────────────────────────────┐
│                  Backend API Server                      │
│                  (Golang + SQLite)                       │
│                                                           │
│  POST   /api/tasks          - Create task                │
│  GET    /api/tasks          - List all tasks             │
│  GET    /api/tasks/{id}     - Get task by ID             │
│  PATCH  /api/tasks/{id}/status - Update task status      │
│  DELETE /api/tasks/{id}     - Delete task                │
└─────────────────────────────────────────────────────────┘
```

### 架构层次说明

**1. Presentation Layer (表示层)**
- 负责 UI 渲染和用户交互
- 组件化设计，每个组件负责特定的 UI 功能
- 纯函数式渲染，接收数据返回 HTML 字符串或 DOM 元素

**2. Application Layer (应用层)**
- TaskService: 封装业务逻辑和数据操作
- UIController: 协调组件和服务，处理用户事件

**3. Data Access Layer (数据访问层)**
- APIClient: 封装所有 HTTP 请求
- StateManager: 管理应用状态和数据缓存

## Components and Interfaces

### 核心模块

#### 1. APIClient (api-client.js)

HTTP 客户端模块，负责与后端 API 通信。

```javascript
class APIClient {
  constructor(baseURL, timeout = 5000)
  
  // 获取所有任务（带请求去重）
  async getTasks(): Promise<Task[]>
  
  // 获取单个任务（带请求去重）
  async getTask(id: number): Promise<Task>
  
  // 创建任务
  async createTask(data: CreateTaskRequest): Promise<Task>
  
  // 更新任务状态
  async updateTaskStatus(id: number, completed: boolean): Promise<Task>
  
  // 删除任务
  async deleteTask(id: number): Promise<void>
  
  // 私有方法：发送 HTTP 请求
  private async request(endpoint: string, options: RequestOptions): Promise<any>
}
```

**职责**:
- 构建和发送 HTTP 请求
- 处理请求超时（使用 AbortController）
- 解析 JSON 响应
- 统一错误处理和转换
- 设置请求头（Content-Type: application/json）
- **请求去重**：使用 `RequestDeduplicator` 防止并发重复请求

**错误处理**:
- 网络错误 → NetworkError
- 超时 → TimeoutError
- HTTP 4xx → ClientError (包含验证错误详情)
- HTTP 5xx → ServerError

**性能优化**:
- `getTasks()` 和 `getTask(id)` 使用请求去重，避免并发重复请求
- 使用 AbortController 实现请求超时控制

#### 2. StateManager (state-manager.js)

状态管理模块，维护应用的全局状态。

```javascript
class StateManager {
  constructor()
  
  // 获取所有任务
  getTasks(): Task[]
  
  // 设置任务列表
  setTasks(tasks: Task[]): void
  
  // 添加任务
  addTask(task: Task): void
  
  // 更新任务
  updateTask(id: number, updates: Partial<Task>): void
  
  // 删除任务
  removeTask(id: number): void
  
  // 订阅状态变化
  subscribe(listener: (tasks: Task[]) => void): () => void
  
  // 获取加载状态
  isLoading(): boolean
  
  // 设置加载状态
  setLoading(loading: boolean): void
  
  // 获取错误信息
  getError(): string | null
  
  // 设置错误信息
  setError(error: string | null): void
}
```

**职责**:
- 维护任务列表的内存缓存
- 提供状态订阅机制（观察者模式）
- 管理加载和错误状态
- 确保状态更新的原子性

#### 3. TaskService (task-service.js)

业务逻辑层，协调 APIClient 和 StateManager。

```javascript
class TaskService {
  constructor(apiClient: APIClient, stateManager: StateManager)
  
  // 加载所有任务
  async loadTasks(): Promise<void>
  
  // 创建新任务
  async createTask(title: string, description: string): Promise<void>
  
  // 切换任务完成状态
  async toggleTaskStatus(id: number): Promise<void>
  
  // 删除任务
  async deleteTask(id: number): Promise<void>
  
  // 验证任务输入
  validateTaskInput(title: string): ValidationResult
}
```

**职责**:
- 协调 API 调用和状态更新
- 实现业务逻辑（如乐观更新）
- 输入验证
- 错误处理和用户反馈

**乐观更新策略**:
- 状态切换：立即更新 UI，失败时回滚
- 删除操作：立即从 UI 移除，失败时恢复
- 创建操作：等待服务器响应后更新（避免 ID 冲突）

#### 4. UI Components

##### TaskListComponent (components/task-list.js)

```javascript
class TaskListComponent {
  constructor(container: HTMLElement, taskService: TaskService)
  
  // 渲染任务列表（带 DOM 批处理优化）
  render(tasks: Task[]): void
  
  // 渲染空状态
  renderEmptyState(): void
  
  // 渲染加载状态
  renderLoading(): void
  
  // 渲染错误状态
  renderError(message: string): void
  
  // 处理任务切换事件（通过自定义事件）
  handleToggle(id: number): void
  
  // 处理任务删除事件（通过自定义事件）
  handleDelete(id: number): void
}
```

**职责**:
- 渲染任务列表，分为"待办任务"和"已完成"两个部分
- 处理空状态、加载状态、错误状态
- 区分已完成和未完成任务的视觉样式
- **性能优化**：使用 `DOMBatcher` 批量更新 DOM，使用 DocumentFragment 减少重排
- 通过自定义事件（`task-toggle`, `task-delete`）与 UIController 通信

##### TaskFormComponent (components/task-form.js)

```javascript
class TaskFormComponent {
  constructor(container: HTMLElement, taskService: TaskService)
  
  // 渲染表单
  render(): void
  
  // 处理表单提交
  handleSubmit(event: Event): Promise<void>
  
  // 验证单个字段（带防抖）
  validateField(field: string): boolean
  
  // 显示验证错误
  showValidationError(field: string, message: string): void
  
  // 清除验证错误
  clearValidationError(field: string): void
  
  // 清空表单
  clearForm(): void
  
  // 显示提交状态
  setSubmitting(submitting: boolean): void
}
```

**职责**:
- 渲染任务创建表单
- **实时输入验证**：使用 300ms 防抖优化性能
- 处理表单提交
- 显示验证错误和提交状态
- **键盘导航**：Enter 键提交表单
- **可访问性**：完整的 ARIA 属性支持

##### TaskItemComponent (components/task-item.js)

```javascript
class TaskItemComponent {
  // 渲染单个任务项
  static render(task: Task, handlers: TaskItemHandlers): HTMLElement
  
  // 格式化日期显示
  static formatDate(date: Date): string
}

interface TaskItemHandlers {
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}
```

**职责**:
- 渲染单个任务项
- 提供切换和删除按钮
- 显示任务详情（标题、描述、时间）
- 应用完成/未完成的视觉样式

##### NotificationComponent (components/notification.js)

```javascript
class NotificationComponent {
  constructor(container: HTMLElement)
  
  // 显示成功消息
  showSuccess(message: string, duration: number = 3000): number
  
  // 显示错误消息
  showError(message: string, duration: number = 5000): number
  
  // 显示信息消息
  showInfo(message: string, duration: number = 3000): number
  
  // 关闭所有通知
  close(): void
  
  // 清理资源
  destroy(): void
}
```

**职责**:
- 显示操作反馈（成功、错误、信息）
- 自动消失或手动关闭
- 支持多个通知堆叠
- **键盘导航**：Escape 键关闭最近的通知
- **XSS 防护**：自动转义 HTML 内容
- **可访问性**：使用 `role="alert"` 和 `aria-live`（错误用 "assertive"，其他用 "polite"）

#### 5. UIController (ui-controller.js)

主控制器，协调所有组件和服务。

```javascript
class UIController {
  constructor(
    taskService: TaskService,
    stateManager: StateManager,
    components: {
      taskList: TaskListComponent,
      taskForm: TaskFormComponent,
      notification: NotificationComponent
    }
  )
  
  // 初始化应用
  async init(): Promise<void>
  
  // 处理状态变化
  handleStateChange(tasks: Task[]): void
  
  // 处理任务切换
  handleTaskToggle(id: number): Promise<void>
  
  // 处理任务删除
  handleTaskDelete(id: number): Promise<void>
  
  // 处理任务创建
  handleTaskCreate(title: string, description: string): Promise<void>
  
  // 清理资源
  destroy(): void
}
```

**职责**:
- 初始化应用和组件
- 订阅状态变化并更新 UI
- 协调用户操作和服务调用
- 统一错误处理和用户反馈
- **事件委托**：通过自定义事件（`task-toggle`, `task-delete`）监听组件操作

## Data Models

### Task

```typescript
interface Task {
  id: number;              // 任务唯一标识符
  title: string;           // 任务标题（必填）
  description: string;     // 任务描述（可选）
  completed: boolean;      // 完成状态
  created_at: string;      // 创建时间（ISO 8601 格式）
}
```

### CreateTaskRequest

```typescript
interface CreateTaskRequest {
  title: string;           // 任务标题（必填，非空）
  description: string;     // 任务描述（可选）
}
```

### UpdateTaskStatusRequest

```typescript
interface UpdateTaskStatusRequest {
  completed: boolean;      // 新的完成状态
}
```

### API Response Formats

**成功响应 - 单个任务**:
```json
{
  "data": {
    "id": 1,
    "title": "完成项目文档",
    "description": "编写技术设计文档",
    "completed": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**成功响应 - 任务列表**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "完成项目文档",
      "description": "编写技术设计文档",
      "completed": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**错误响应**:
```json
{
  "error": "validation_error",
  "message": "title cannot be empty"
}
```

### Error Types

```typescript
// 基础错误类
class AppError extends Error {
  constructor(message: string, public code: string)
}

// 网络错误
class NetworkError extends AppError {
  constructor(message: string = "网络连接失败，请检查网络设置")
}

// 超时错误
class TimeoutError extends AppError {
  constructor(message: string = "请求超时，请稍后重试")
}

// 客户端错误（4xx）
class ClientError extends AppError {
  constructor(message: string, public statusCode: number)
}

// 服务器错误（5xx）
class ServerError extends AppError {
  constructor(message: string = "服务器错误，请稍后重试")
}

// 验证错误
class ValidationError extends AppError {
  constructor(public field: string, message: string)
}
```

### Validation Rules

**任务标题验证**:
- 必填字段
- 去除首尾空格后不能为空
- 最大长度：200 字符（前端限制）

**任务描述验证**:
- 可选字段
- 最大长度：1000 字符（前端限制）


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.1 and 9.2 both test that tasks are fetched on page load - these can be combined
- Properties 1.5, 2.6, 3.4, and 6.1 all test error message display - these can be consolidated into a general error handling property
- Properties 2.3, 3.3, 4.3, and 9.1 all test UI synchronization after operations - these can be combined into a single comprehensive property

### Property 1: Task List Rendering Completeness

*For any* set of tasks returned by the API, when the task list is rendered, each task item should display all required fields: title, description, completion status, and creation time.

**Validates: Requirements 1.2**

### Property 2: Visual Distinction by Completion Status

*For any* task, the rendered task item should have different CSS classes or styles based on whether the task is completed or not completed.

**Validates: Requirements 1.3**

### Property 3: API Error Display

*For any* API operation (fetch, create, update, delete) that fails, the frontend should display a user-friendly error message to the user.

**Validates: Requirements 1.5, 2.6, 3.4, 6.1, 6.2**

### Property 4: Valid Task Creation API Call

*For any* valid task data (non-empty title and description), when the user submits the form, the HTTP client should send a POST request to /api/tasks with the correct payload format.

**Validates: Requirements 2.2**

### Property 5: UI Synchronization After Operations

*For any* successful CRUD operation (create, delete, update status), the task list UI should be updated to reflect the new state, showing the correct set of tasks with their current properties.

**Validates: Requirements 2.3, 3.3, 4.3, 9.1**

### Property 6: Form Reset After Creation

*For any* successful task creation, the form input fields should be cleared and ready for the next entry.

**Validates: Requirements 2.4**

### Property 7: Empty Title Validation

*For any* string composed entirely of whitespace characters (including empty string), attempting to create a task with that title should display a validation error and prevent form submission.

**Validates: Requirements 2.5**

### Property 8: Delete API Call Correctness

*For any* task with a given ID, when the user clicks the delete button, the HTTP client should send a DELETE request to /api/tasks/{id} with the correct task ID.

**Validates: Requirements 3.2**

### Property 9: Status Toggle API Call Correctness

*For any* task, when the user toggles the completion status, the HTTP client should send a PATCH request to /api/tasks/{id}/status with the new completion state.

**Validates: Requirements 4.2**

### Property 10: Rollback on Update Failure

*For any* task status toggle that fails (API returns error), the task's visual state should be reverted to its original completion status and an error message should be displayed.

**Validates: Requirements 4.5**

### Property 11: JSON Content-Type Header

*For all* HTTP requests sent by the API client, the Content-Type header should be set to "application/json".

**Validates: Requirements 5.2**

### Property 12: JSON Response Parsing

*For any* valid JSON response from the backend API, the HTTP client should correctly parse it into the corresponding JavaScript object structure (Task, Task[], or ErrorResponse).

**Validates: Requirements 5.3**

### Property 13: HTTP Status Code Handling

*For any* HTTP response, the API client should handle it appropriately based on status code: 2xx as success, 4xx as client error, 5xx as server error, with corresponding error types.

**Validates: Requirements 5.4**

### Property 14: Success Operation Feedback

*For any* successful operation (create, delete, update), the frontend should display a visual confirmation message to the user.

**Validates: Requirements 6.3**

### Property 15: Loading State Display

*For any* API request in progress, the frontend should display a loading indicator until the response is received or the request times out.

**Validates: Requirements 6.4**

### Property 16: Validation Error Field Association

*For any* validation error returned by the API, the error message should be displayed near or associated with the relevant form field.

**Validates: Requirements 6.5**

### Property 17: Responsive Layout Adaptation

*For any* viewport width, the UI components should adapt their layout appropriately (e.g., single column on mobile, multi-column on desktop).

**Validates: Requirements 7.3**

### Property 18: Interactive Element States

*For any* interactive UI element (button, input, checkbox), it should have appropriate visual states for hover, active, focus, and disabled conditions.

**Validates: Requirements 8.2**

### Property 19: Real-time Form Validation

*For any* user input in the task form, validation feedback should be provided as the user types, not just on form submission.

**Validates: Requirements 8.3**

### Property 20: Accessibility Labels

*For all* interactive elements (buttons, inputs, checkboxes), they should have appropriate ARIA labels, roles, or associated label elements for screen reader accessibility.

**Validates: Requirements 8.5**

### Property 21: Concurrent Operation Consistency

*For any* set of concurrent operations on tasks, when all operations complete, the final UI state should be consistent with the backend state, regardless of response order.

**Validates: Requirements 9.3**

### Property 22: Failed Operation State Consistency

*For any* operation that fails, the UI state should remain consistent with the backend state (no orphaned or incorrect data in the UI).

**Validates: Requirements 9.4**

### Property 23: API Request Deduplication

*For any* sequence of user actions, the frontend should not make redundant API requests for the same data within a short time window.

**Validates: Requirements 10.3**


## Error Handling

### Error Handling Strategy

The application implements a comprehensive error handling strategy with clear user feedback and graceful degradation.

### Error Categories and Handling

#### 1. Network Errors

**Scenario**: Network connection unavailable or DNS resolution fails

**Handling**:
- Catch `TypeError` or `fetch` network errors
- Display user-friendly message: "网络连接失败，请检查网络设置"
- Provide retry option
- Maintain current UI state (don't clear existing data)

**Implementation**:
```javascript
try {
  const response = await fetch(url, options);
} catch (error) {
  if (error instanceof TypeError) {
    throw new NetworkError();
  }
}
```

#### 2. Timeout Errors

**Scenario**: API request exceeds configured timeout (5 seconds default)

**Handling**:
- Use `AbortController` to cancel long-running requests
- Display message: "请求超时，请稍后重试"
- Provide retry option
- Log timeout for monitoring

**Implementation**:
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
try {
  const response = await fetch(url, { ...options, signal: controller.signal });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new TimeoutError();
  }
}
```

#### 3. Client Errors (4xx)

**Scenario**: Invalid request data or validation errors

**Handling**:
- Parse error response body for specific error messages
- Display field-specific validation errors near form inputs
- For 404 errors: "请求的资源不存在"
- For 400 errors: Display server-provided validation message
- Don't retry automatically (user must fix input)

**Common Cases**:
- 400 Bad Request: Show validation errors from API
- 404 Not Found: Task doesn't exist (may have been deleted)
- 422 Unprocessable Entity: Validation failed

#### 4. Server Errors (5xx)

**Scenario**: Backend service error or database issues

**Handling**:
- Display generic message: "服务器错误，请稍后重试"
- Provide retry option
- Log error details for debugging
- Don't expose internal error details to users

**Common Cases**:
- 500 Internal Server Error
- 503 Service Unavailable

#### 5. Validation Errors (Client-Side)

**Scenario**: Invalid input before API call

**Handling**:
- Validate on input change (real-time feedback)
- Validate on form submission (final check)
- Display inline error messages
- Disable submit button until valid
- Highlight invalid fields with red border

**Validation Rules**:
- Title: Required, non-whitespace, max 200 characters
- Description: Optional, max 1000 characters

#### 6. State Inconsistency Errors

**Scenario**: UI state doesn't match backend state

**Handling**:
- Implement optimistic updates with rollback
- On operation failure, revert to previous state
- Refresh data from server if inconsistency detected
- Show error message explaining the issue

### Error Display Patterns

#### Toast Notifications

Used for temporary feedback on operations:
- Success: Green background, auto-dismiss after 3 seconds
- Error: Red background, auto-dismiss after 5 seconds or manual close
- Info: Blue background, auto-dismiss after 3 seconds

#### Inline Validation Messages

Used for form validation:
- Display below or next to the invalid field
- Red text with error icon
- Update in real-time as user types
- Clear when field becomes valid

#### Error State Screens

Used for critical failures:
- Empty state with error icon
- Clear error message
- Retry button or action suggestion
- Maintain navigation and app structure

### Error Recovery Strategies

#### Optimistic Updates

For better UX, update UI immediately and rollback on failure:

**Status Toggle**:
1. Immediately update checkbox and styling
2. Send API request
3. If fails: Revert checkbox and styling, show error
4. If succeeds: Keep updated state

**Task Deletion**:
1. Immediately remove from UI with fade-out animation
2. Send API request
3. If fails: Re-add task to UI, show error
4. If succeeds: Keep removed

**Task Creation**:
- Don't use optimistic update (need server-generated ID)
- Show loading state during creation
- Add to list only after successful response

#### Retry Logic

**Automatic Retry**: Not implemented (avoid hammering failed services)

**Manual Retry**: 
- Provide "重试" button in error messages
- User controls when to retry
- Clear error state before retry

#### Graceful Degradation

**Partial Failures**:
- If task list loads but one task fails to render: Show others, log error
- If delete fails: Keep task visible, show error
- If status update fails: Revert to original state

**Offline Mode**:
- Detect offline state: `!navigator.onLine`
- Show offline indicator
- Queue operations for when connection returns (future enhancement)

### Error Logging

**Client-Side Logging**:
```javascript
function logError(error, context) {
  console.error('[TodoApp Error]', {
    message: error.message,
    code: error.code,
    context: context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
  
  // Future: Send to error tracking service (e.g., Sentry)
}
```

**What to Log**:
- Error type and message
- API endpoint and request details
- User action that triggered error
- Timestamp and user agent
- Stack trace (for unexpected errors)

**What NOT to Log**:
- User input data (privacy)
- Authentication tokens
- Sensitive error details shown to users


## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomization

Both approaches are complementary and necessary. Unit tests catch concrete bugs and verify specific behaviors, while property tests verify general correctness across a wide range of inputs.

### Testing Framework Selection

**Unit Testing**:
- **Framework**: Jest (or Vitest for faster execution)
- **DOM Testing**: jsdom for Node.js environment
- **Mocking**: Jest's built-in mocking for API calls

**Property-Based Testing**:
- **Framework**: fast-check (JavaScript property-based testing library)
- **Configuration**: Minimum 100 iterations per property test
- **Integration**: Works alongside Jest/Vitest

**Why fast-check**:
- Mature JavaScript PBT library with good TypeScript support
- Automatic shrinking to find minimal failing cases
- Rich set of built-in generators (strings, numbers, objects, arrays)
- Easy integration with existing test frameworks

### Test Organization

```
tests/
├── unit/
│   ├── api-client.test.js          # APIClient unit tests
│   ├── state-manager.test.js       # StateManager unit tests
│   ├── task-service.test.js        # TaskService unit tests
│   ├── components/
│   │   ├── task-list.test.js       # TaskListComponent tests
│   │   ├── task-form.test.js       # TaskFormComponent tests
│   │   ├── task-item.test.js       # TaskItemComponent tests
│   │   └── notification.test.js    # NotificationComponent tests
│   └── ui-controller.test.js       # UIController integration tests
├── property/
│   ├── rendering.property.test.js  # Properties 1, 2, 17
│   ├── api-client.property.test.js # Properties 4, 8, 9, 11, 12, 13
│   ├── error-handling.property.test.js # Properties 3, 10, 22
│   ├── form-validation.property.test.js # Properties 7, 16, 19
│   ├── state-sync.property.test.js # Properties 5, 6, 21
│   ├── ui-feedback.property.test.js # Properties 14, 15, 18
│   └── accessibility.property.test.js # Property 20
└── e2e/
    └── user-flows.test.js          # End-to-end user scenarios
```

### Property-Based Test Configuration

Each property test must:
1. Run minimum 100 iterations (configured in fast-check)
2. Include a comment tag referencing the design property
3. Use appropriate generators for test data

**Tag Format**:
```javascript
// Feature: memo-frontend, Property 1: Task List Rendering Completeness
test('property: all task fields are rendered', () => {
  fc.assert(
    fc.property(fc.array(taskGenerator()), (tasks) => {
      // Test implementation
    }),
    { numRuns: 100 }
  );
});
```

### Test Data Generators

**Task Generator**:
```javascript
const taskGenerator = () => fc.record({
  id: fc.integer({ min: 1 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ maxLength: 1000 }),
  completed: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString())
});
```

**Whitespace String Generator** (for validation tests):
```javascript
const whitespaceStringGenerator = () => fc.oneof(
  fc.constant(''),
  fc.constant(' '),
  fc.constant('  '),
  fc.constant('\t'),
  fc.constant('\n'),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n'))
);
```

**API Error Generator**:
```javascript
const apiErrorGenerator = () => fc.record({
  error: fc.constantFrom('validation_error', 'not_found', 'server_error'),
  message: fc.string({ minLength: 1 })
});
```

### Unit Test Coverage

**APIClient Tests**:
- Successful requests for all endpoints
- Request timeout handling
- Network error handling
- HTTP status code handling (200, 400, 404, 500, 503)
- JSON parsing errors
- Request header configuration
- Base URL configuration

**StateManager Tests**:
- Task CRUD operations on state
- State subscription and notification
- Loading state management
- Error state management
- State immutability

**TaskService Tests**:
- Task loading with API integration
- Task creation with validation
- Task deletion with optimistic update
- Status toggle with rollback on error
- Error propagation to UI

**Component Tests**:
- TaskListComponent: Rendering tasks, empty state, loading state, error state
- TaskFormComponent: Form submission, validation, clearing, error display
- TaskItemComponent: Rendering task details, toggle button, delete button
- NotificationComponent: Success/error/info messages, auto-dismiss, manual close

**UIController Tests**:
- Application initialization
- State change handling
- User action coordination
- Error handling and user feedback

### Property-Based Test Examples

**Property 1: Task List Rendering Completeness**
```javascript
// Feature: memo-frontend, Property 1: Task List Rendering Completeness
fc.assert(
  fc.property(fc.array(taskGenerator()), (tasks) => {
    const rendered = TaskListComponent.render(tasks);
    return tasks.every(task => {
      const html = rendered.innerHTML;
      return html.includes(task.title) &&
             html.includes(task.description) &&
             html.includes(task.id.toString()) &&
             html.includes(formatDate(task.created_at));
    });
  }),
  { numRuns: 100 }
);
```

**Property 7: Empty Title Validation**
```javascript
// Feature: memo-frontend, Property 7: Empty Title Validation
fc.assert(
  fc.property(whitespaceStringGenerator(), (title) => {
    const result = TaskService.validateTaskInput(title);
    return !result.valid && result.error.includes('title');
  }),
  { numRuns: 100 }
);
```

**Property 13: HTTP Status Code Handling**
```javascript
// Feature: memo-frontend, Property 13: HTTP Status Code Handling
fc.assert(
  fc.property(
    fc.integer({ min: 200, max: 599 }),
    fc.string(),
    async (statusCode, message) => {
      const mockResponse = { status: statusCode, body: { message } };
      const error = APIClient.handleResponse(mockResponse);
      
      if (statusCode >= 200 && statusCode < 300) {
        return error === null;
      } else if (statusCode >= 400 && statusCode < 500) {
        return error instanceof ClientError;
      } else if (statusCode >= 500) {
        return error instanceof ServerError;
      }
      return true;
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing

**API Integration Tests**:
- Test against mock server (e.g., MSW - Mock Service Worker)
- Verify request/response flow
- Test error scenarios
- Verify state synchronization

**Component Integration Tests**:
- Test component interactions
- Test event propagation
- Test state updates across components

### End-to-End Testing

**User Flow Tests** (optional, using Playwright or Cypress):
1. Load app → See task list
2. Create new task → Task appears in list
3. Toggle task status → Visual update
4. Delete task → Task removed
5. Error scenarios → Error messages displayed

**E2E Test Scope**:
- Critical user paths
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile responsive behavior
- Accessibility with screen readers

### Test Execution

**Development**:
```bash
npm test                 # Run all tests
npm test:unit           # Run unit tests only
npm test:property       # Run property tests only
npm test:watch          # Watch mode for development
npm test:coverage       # Generate coverage report
```

**CI/CD Pipeline**:
1. Run linter (ESLint)
2. Run unit tests
3. Run property tests (100 iterations each)
4. Generate coverage report (target: >80%)
5. Run E2E tests (if implemented)

### Coverage Goals

- **Line Coverage**: >80%
- **Branch Coverage**: >75%
- **Function Coverage**: >85%
- **Property Coverage**: 100% of defined properties tested

### Testing Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should clearly describe what is being tested
3. **Speed**: Unit tests should run quickly (<1s per test)
4. **Reliability**: Tests should not be flaky
5. **Maintainability**: Avoid testing implementation details, focus on behavior
6. **Mocking**: Mock external dependencies (API calls, timers)
7. **Assertions**: Use specific assertions, avoid generic truthy checks

### Mock Data Strategy

**Consistent Test Data**:
- Use factories for creating test objects
- Provide realistic but simple test data
- Use generators for property tests
- Keep test data minimal but sufficient

**Example Factory**:
```javascript
function createMockTask(overrides = {}) {
  return {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    created_at: '2024-01-15T10:00:00Z',
    ...overrides
  };
}
```


## UI/UX Design

### Design Principles

1. **Simplicity**: Clean, uncluttered interface focused on task management
2. **Clarity**: Clear visual hierarchy and obvious interaction patterns
3. **Responsiveness**: Immediate feedback for all user actions
4. **Accessibility**: Keyboard navigation, screen reader support, sufficient color contrast
5. **Performance**: Fast loading and smooth interactions

### Visual Design

#### Color Scheme

```css
:root {
  /* Primary Colors */
  --color-primary: #3b82f6;        /* Blue - primary actions */
  --color-primary-hover: #2563eb;  /* Darker blue - hover state */
  --color-primary-light: #dbeafe;  /* Light blue - backgrounds */
  
  /* Status Colors */
  --color-success: #10b981;        /* Green - success messages */
  --color-error: #ef4444;          /* Red - errors */
  --color-warning: #f59e0b;        /* Orange - warnings */
  --color-info: #3b82f6;           /* Blue - info messages */
  
  /* Neutral Colors */
  --color-text-primary: #1f2937;   /* Dark gray - main text */
  --color-text-secondary: #6b7280; /* Medium gray - secondary text */
  --color-text-disabled: #9ca3af;  /* Light gray - disabled text */
  --color-border: #e5e7eb;         /* Light gray - borders */
  --color-background: #ffffff;     /* White - main background */
  --color-background-alt: #f9fafb; /* Off-white - alternate background */
  
  /* Task States */
  --color-task-completed: #d1fae5; /* Light green - completed task background */
  --color-task-active: #ffffff;    /* White - active task background */
}
```

#### Typography

```css
:root {
  /* Font Families */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                      Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
  
  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  
  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

#### Spacing System

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
}
```

### Layout Structure

#### Desktop Layout (≥768px)

```
┌─────────────────────────────────────────────────────────┐
│                     Header                               │
│                     Memo                                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Task Creation Form                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────┐  │   │
│  │  │ Title Input  │  │ Description  │  │ Add  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Active Tasks (Uncompleted)             │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ ☐ Task 1 Title                    [×]   │    │   │
│  │  │   Description...                         │    │   │
│  │  │   Created: 2024-01-15 10:30             │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ ☐ Task 2 Title                    [×]   │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Completed Tasks                        │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ ☑ Task 3 Title (strikethrough)   [×]   │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Mobile Layout (<768px)

```
┌──────────────────────────┐
│        Header            │
│         Memo             │
├──────────────────────────┤
│                          │
│  ┌──────────────────┐   │
│  │  Task Form       │   │
│  │  [Title]         │   │
│  │  [Description]   │   │
│  │  [Add Button]    │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │ ☐ Task 1   [×]  │   │
│  │   Desc...        │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ ☐ Task 2   [×]  │   │
│  └──────────────────┘   │
│                          │
│  Completed (2)           │
│  ┌──────────────────┐   │
│  │ ☑ Task 3   [×]  │   │
│  └──────────────────┘   │
│                          │
└──────────────────────────┘
```

### Component Specifications

#### Task Item Component

**States**:
- Default (uncompleted)
- Completed (with strikethrough)
- Hover (show delete button)
- Loading (during status update)
- Error (failed operation)

**Visual Elements**:
- Checkbox/toggle for completion status
- Task title (bold, larger font)
- Task description (secondary text, smaller font)
- Creation timestamp (small, gray text)
- Delete button (visible on hover or always on mobile)

**Interactions**:
- Click checkbox → Toggle completion status
- Click delete button → Confirm and delete task
- Hover → Highlight background, show delete button

#### Task Form Component

**Visual Elements**:
- Title input field (required indicator)
- Description textarea (optional)
- Submit button (disabled when invalid)
- Validation error messages (inline, red text)

**States**:
- Empty (initial state)
- Typing (real-time validation)
- Valid (submit button enabled)
- Invalid (error messages shown, submit disabled)
- Submitting (loading spinner, disabled inputs)
- Success (form cleared, success message)
- Error (error message shown, form remains filled)

**Interactions**:
- Type in title → Real-time validation
- Type in description → Character count (optional)
- Click submit → Validate and create task
- Press Enter in title → Submit form

#### Notification Component

**Types**:
- Success: Green background, checkmark icon
- Error: Red background, X icon
- Info: Blue background, info icon

**Behavior**:
- Slide in from top or bottom
- Auto-dismiss after timeout (configurable)
- Manual close button
- Stack multiple notifications
- Animate out on dismiss

### Accessibility Features

#### Keyboard Navigation

- Tab: Navigate between interactive elements
- Enter: Submit form, toggle task status
- Space: Toggle checkboxes
- Escape: Close modals/notifications
- Arrow keys: Navigate task list (optional enhancement)

#### Screen Reader Support

**ARIA Labels**:
```html
<button aria-label="删除任务: 完成项目文档">×</button>
<input aria-label="任务标题" aria-required="true" />
<div role="alert" aria-live="polite">任务创建成功</div>
<ul role="list" aria-label="待办任务列表">
  <li role="listitem">...</li>
</ul>
```

**Focus Management**:
- Visible focus indicators (outline or ring)
- Logical tab order
- Focus trap in modals (if used)
- Return focus after actions

#### Color Contrast

- Text on background: Minimum 4.5:1 ratio (WCAG AA)
- Large text: Minimum 3:1 ratio
- Interactive elements: Sufficient contrast in all states
- Don't rely solely on color for information

### Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small devices (phones, <640px) */
@media (max-width: 639px) {
  /* Single column layout */
  /* Larger touch targets (min 44x44px) */
  /* Simplified navigation */
}

/* Medium devices (tablets, 640px-1023px) */
@media (min-width: 640px) and (max-width: 1023px) {
  /* Two column layout for form */
  /* Larger task items */
}

/* Large devices (desktops, ≥1024px) */
@media (min-width: 1024px) {
  /* Maximum content width: 1200px */
  /* Side-by-side layouts */
  /* Hover effects enabled */
}
```

### Animation and Transitions

**Principles**:
- Subtle and purposeful
- Fast (200-300ms)
- Respect `prefers-reduced-motion`

**Common Animations**:
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in */
@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Fade out */
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Loading States

**Skeleton Screens**: Show placeholder content while loading
**Spinners**: For button actions and small components
**Progress Bars**: For longer operations (if needed)

**Example**:
```html
<!-- Loading state for task list -->
<div class="task-item skeleton">
  <div class="skeleton-checkbox"></div>
  <div class="skeleton-text"></div>
  <div class="skeleton-text short"></div>
</div>
```

### Empty States

**No Tasks**:
- Friendly illustration or icon
- Message: "还没有任务，创建第一个任务开始吧！"
- Highlight the create form

**No Completed Tasks**:
- Message: "还没有完成的任务"
- Encourage completing tasks

**Error State**:
- Error icon
- Clear error message
- Retry button or action suggestion


## File Structure

```
memo-frontend/
├── index.html                      # Main HTML file
├── css/
│   ├── main.css                    # Main stylesheet
│   ├── variables.css               # CSS custom properties
│   ├── components/
│   │   ├── task-list.css          # Task list styles
│   │   ├── task-item.css          # Task item styles
│   │   ├── task-form.css          # Form styles
│   │   └── notification.css       # Notification styles
│   └── utilities.css               # Utility classes
├── js/
│   ├── main.js                     # Application entry point
│   ├── config.js                   # Configuration (API base URL)
│   ├── api-client.js               # HTTP client
│   ├── state-manager.js            # State management
│   ├── task-service.js             # Business logic
│   ├── ui-controller.js            # Main controller
│   ├── utils/
│   │   ├── errors.js               # Error classes
│   │   ├── validators.js           # Validation functions
│   │   ├── date-formatter.js       # Date formatting utilities
│   │   └── performance.js          # Performance utilities (debounce, throttle, RequestDeduplicator, DOMBatcher, PerformanceMonitor)
│   └── components/
│       ├── task-list.js            # Task list component
│       ├── task-form.js            # Task form component
│       ├── task-item.js            # Task item component
│       └── notification.js         # Notification component
├── tests/
│   ├── unit/
│   │   ├── api-client.test.js
│   │   ├── state-manager.test.js
│   │   ├── task-service.test.js
│   │   └── components/
│   │       ├── task-list.test.js
│   │       ├── task-form.test.js
│   │       ├── task-item.test.js
│   │       └── notification.test.js
│   ├── property/
│   │   ├── rendering.property.test.js
│   │   ├── api-client.property.test.js
│   │   ├── error-handling.property.test.js
│   │   ├── form-validation.property.test.js
│   │   ├── state-sync.property.test.js
│   │   ├── ui-feedback.property.test.js
│   │   └── accessibility.property.test.js
│   ├── helpers/
│   │   ├── generators.js           # fast-check generators
│   │   ├── factories.js            # Test data factories
│   │   └── mocks.js                # Mock objects
│   └── setup.js                    # Test environment setup
├── package.json                    # Dependencies and scripts
├── jest.config.js                  # Jest configuration
├── .eslintrc.js                    # ESLint configuration
├── .gitignore                      # Git ignore rules
└── README.md                       # Project documentation
```

### Key Files Description

#### index.html

Main HTML file with semantic structure:
- Meta tags for responsive design
- Link to CSS files
- Script tags for JavaScript modules (type="module")
- Basic HTML structure with containers for components

#### js/main.js

Application entry point:
```javascript
import { APIClient } from './api-client.js';
import { StateManager } from './state-manager.js';
import { TaskService } from './task-service.js';
import { UIController } from './ui-controller.js';
import { TaskListComponent } from './components/task-list.js';
import { TaskFormComponent } from './components/task-form.js';
import { NotificationComponent } from './components/notification.js';
import { config } from './config.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  const apiClient = new APIClient(config.apiBaseURL);
  const stateManager = new StateManager();
  const taskService = new TaskService(apiClient, stateManager);
  
  const components = {
    taskList: new TaskListComponent(
      document.getElementById('task-list'),
      taskService
    ),
    taskForm: new TaskFormComponent(
      document.getElementById('task-form'),
      taskService
    ),
    notification: new NotificationComponent(
      document.getElementById('notification-container')
    )
  };
  
  const controller = new UIController(taskService, stateManager, components);
  controller.init();
});
```

#### js/config.js

Configuration file:
```javascript
export const config = {
  apiBaseURL: process.env.API_BASE_URL || 'http://localhost:8080',
  apiTimeout: 5000,
  notificationDuration: {
    success: 3000,
    error: 5000,
    info: 3000
  },
  maxTitleLength: 200,
  maxDescriptionLength: 1000
};
```

### Module Dependencies

**No External Runtime Dependencies**: The application uses only browser-native APIs.

**Development Dependencies**:
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "jsdom": "^22.0.0",
    "fast-check": "^3.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Build and Deployment

#### Development

No build step required for development:
1. Start backend server on port 8080
2. Serve frontend files with any static server:
   ```bash
   npx serve .
   # or
   python -m http.server 3000
   ```
3. Open browser to http://localhost:3000

#### Production

**Option 1: Static File Hosting**
- Deploy to Netlify, Vercel, GitHub Pages, or any CDN
- Configure API base URL via environment variable
- Enable CORS on backend for frontend domain

**Option 2: Serve from Backend**
- Place frontend files in backend's static directory
- Backend serves both API and frontend
- No CORS configuration needed

**Production Optimizations** (optional):
- Minify CSS and JavaScript
- Combine CSS files
- Add cache headers
- Enable gzip/brotli compression
- Use CDN for static assets

#### Environment Configuration

**Development**:
```javascript
// config.js
export const config = {
  apiBaseURL: 'http://localhost:8080',
  // ...
};
```

**Production**:
```javascript
// config.js
export const config = {
  apiBaseURL: window.ENV?.API_BASE_URL || 'https://api.example.com',
  // ...
};
```

Inject environment variables via HTML:
```html
<script>
  window.ENV = {
    API_BASE_URL: '${API_BASE_URL}'
  };
</script>
```

### Browser Compatibility

**Target Browsers**:
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 12+
- Chrome Mobile: Last 2 versions

**Required Browser Features**:
- ES6+ (classes, modules, async/await, arrow functions)
- Fetch API
- Promise
- CSS Grid and Flexbox
- CSS Custom Properties
- localStorage (optional, for future enhancements)

**Polyfills**: Not required for target browsers

### Performance Considerations

**Initial Load**:
- Minimize HTTP requests (combine CSS if needed)
- Inline critical CSS (optional)
- Defer non-critical JavaScript
- Use browser caching

**Runtime Performance**:
- **Efficient DOM manipulation**: Use `DOMBatcher` for batch updates with `requestAnimationFrame`
- **Debounce input validation**: 300ms delay for real-time validation
- **Throttle scroll events**: If implemented
- **Avoid layout thrashing**: Batch DOM reads and writes
- **Request deduplication**: Prevent concurrent duplicate API calls using `RequestDeduplicator`

**Network Performance**:
- Request deduplication for `getTasks()` and `getTask(id)`
- Optimistic updates for better perceived performance
- Proper HTTP caching headers
- Compress responses (gzip/brotli)

**Performance Utilities**:
- `debounce(func, wait)`: Delays execution until after wait time
- `throttle(func, wait)`: Ensures function called at most once per wait period
- `RequestDeduplicator`: Prevents duplicate concurrent requests
- `DOMBatcher`: Batches DOM updates using requestAnimationFrame
- `PerformanceMonitor`: Tracks performance metrics with marks and measures

### Security Considerations

**XSS Prevention**:
- Sanitize user input before rendering
- Use textContent instead of innerHTML for user data
- Escape HTML entities in task titles and descriptions

**CSRF Protection**:
- Backend should implement CSRF tokens (if using cookies)
- Use SameSite cookie attribute

**CORS Configuration**:
- Backend should whitelist frontend domain
- Don't use wildcard (*) in production

**Content Security Policy**:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               connect-src 'self' https://api.example.com;">
```

### Monitoring and Analytics

**Error Tracking** (optional):
- Integrate Sentry or similar service
- Track JavaScript errors
- Track API failures
- Monitor performance metrics

**Usage Analytics** (optional):
- Track user actions (task creation, completion, deletion)
- Monitor page load times
- Track error rates
- A/B testing for UI improvements

### Future Enhancements

**Phase 2 Features**:
- Offline support with Service Worker
- Task editing (update title/description)
- Task filtering and sorting
- Task search
- Task categories/tags
- Due dates and reminders
- Drag-and-drop reordering
- Bulk operations
- Dark mode
- Keyboard shortcuts
- Export/import tasks

**Technical Improvements**:
- Progressive Web App (PWA)
- IndexedDB for offline storage
- WebSocket for real-time updates
- Virtual scrolling for large lists
- Code splitting for faster initial load
- Internationalization (i18n)

## Summary

This design document provides a comprehensive blueprint for building a lightweight, performant, and accessible Memo Web Frontend. The architecture emphasizes:

- **Simplicity**: Vanilla JavaScript with no framework dependencies
- **Modularity**: Clear separation of concerns across layers
- **Testability**: Comprehensive testing strategy with both unit and property-based tests
- **User Experience**: Responsive design, immediate feedback, and graceful error handling
- **Maintainability**: Well-organized code structure and clear interfaces
- **Accessibility**: Keyboard navigation, screen reader support, and WCAG compliance

The implementation will integrate seamlessly with the existing Golang backend API, providing users with an intuitive interface for managing their tasks across all devices.

