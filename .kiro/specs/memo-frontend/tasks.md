# Implementation Plan: Memo Web Frontend

## Overview

本实施计划将基于原生 HTML/CSS/JavaScript 技术栈构建 Memo Web Frontend。实现将分为项目初始化、核心模块开发、UI 组件开发、样式实现和测试等阶段。每个任务都引用了相应的需求条款，确保完整的需求覆盖。

## Tasks

- [x] 1. 项目初始化和基础结构
  - 创建项目目录结构（css/, js/, js/components/, js/utils/, tests/）
  - 创建 index.html 主文件，包含语义化 HTML 结构和必要的容器元素
  - 创建 package.json 配置文件，添加开发依赖（jest, jsdom, fast-check, eslint）
  - 创建 jest.config.js 和 .eslintrc.js 配置文件
  - 创建 js/config.js 配置文件，定义 API 基础 URL 和其他配置项
  - _Requirements: 5.1, 7.1, 7.4_

- [x] 2. 实现错误处理类和工具函数
  - 在 js/utils/errors.js 中实现错误类（AppError, NetworkError, TimeoutError, ClientError, ServerError, ValidationError）
  - 在 js/utils/validators.js 中实现输入验证函数（validateTaskInput）
  - 在 js/utils/date-formatter.js 中实现日期格式化函数
  - _Requirements: 2.5, 6.1, 6.2, 6.5_

- [x] 3. 实现 APIClient 模块
  - [x] 3.1 创建 APIClient 类基础结构
    - 在 js/api-client.js 中实现 APIClient 类构造函数
    - 实现私有 request 方法，处理 HTTP 请求、超时、错误转换
    - 实现 JSON Content-Type 头设置
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [x] 3.2 实现 API 端点方法
    - 实现 getTasks() 方法（GET /api/tasks）
    - 实现 createTask() 方法（POST /api/tasks）
    - 实现 updateTaskStatus() 方法（PATCH /api/tasks/{id}/status）
    - 实现 deleteTask() 方法（DELETE /api/tasks/{id}）
    - _Requirements: 1.1, 2.2, 3.2, 4.2, 5.3_
  
  - [x] 3.3 编写 APIClient 属性测试
    - **Property 4: Valid Task Creation API Call** - 验证有效任务数据的 POST 请求格式
    - **Property 8: Delete API Call Correctness** - 验证删除请求的正确性
    - **Property 9: Status Toggle API Call Correctness** - 验证状态切换请求的正确性
    - **Property 11: JSON Content-Type Header** - 验证所有请求包含正确的 Content-Type 头
    - **Property 12: JSON Response Parsing** - 验证 JSON 响应解析的正确性
    - **Property 13: HTTP Status Code Handling** - 验证不同 HTTP 状态码的处理
    - **Validates: Requirements 2.2, 3.2, 4.2, 5.2, 5.3, 5.4**
  
  - [x] 3.4 编写 APIClient 单元测试
    - 测试成功请求场景（所有端点）
    - 测试网络错误处理
    - 测试超时处理
    - 测试各种 HTTP 状态码（200, 400, 404, 500, 503）
    - _Requirements: 5.4, 5.5, 6.1, 6.2_

- [x] 4. 实现 StateManager 模块
  - [x] 4.1 创建 StateManager 类
    - 在 js/state-manager.js 中实现 StateManager 类
    - 实现任务列表状态管理（getTasks, setTasks, addTask, updateTask, removeTask）
    - 实现观察者模式（subscribe 方法）
    - 实现加载和错误状态管理（isLoading, setLoading, getError, setError）
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 4.2 编写 StateManager 单元测试
    - 测试任务 CRUD 操作
    - 测试状态订阅和通知机制
    - 测试状态不可变性
    - 测试加载和错误状态管理
    - _Requirements: 9.1, 9.3, 9.4_

- [x] 5. 实现 TaskService 模块
  - [x] 5.1 创建 TaskService 类
    - 在 js/task-service.js 中实现 TaskService 类
    - 实现 loadTasks() 方法，协调 API 调用和状态更新
    - 实现 createTask() 方法，包含输入验证
    - 实现 toggleTaskStatus() 方法，使用乐观更新策略
    - 实现 deleteTask() 方法，使用乐观更新策略
    - 实现 validateTaskInput() 方法
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 4.2, 4.3, 4.5_
  
  - [x] 5.2 编写 TaskService 属性测试
    - **Property 5: UI Synchronization After Operations** - 验证 CRUD 操作后 UI 状态同步
    - **Property 6: Form Reset After Creation** - 验证任务创建后表单重置
    - **Property 7: Empty Title Validation** - 验证空标题验证逻辑
    - **Property 10: Rollback on Update Failure** - 验证更新失败时的回滚机制
    - **Validates: Requirements 2.3, 2.4, 2.5, 3.3, 4.3, 4.5, 9.1**
  
  - [x] 5.3 编写 TaskService 单元测试
    - 测试任务加载流程
    - 测试任务创建和验证
    - 测试任务删除的乐观更新
    - 测试状态切换的乐观更新和回滚
    - 测试错误传播
    - _Requirements: 2.5, 4.5, 6.1_

- [x] 6. Checkpoint - 核心模块完成
  - 确保所有核心模块测试通过，如有问题请询问用户

- [x] 7. 实现 TaskItemComponent
  - [x] 7.1 创建 TaskItemComponent
    - 在 js/components/task-item.js 中实现 TaskItemComponent
    - 实现 render() 静态方法，返回任务项 DOM 元素
    - 实现复选框、标题、描述、时间戳、删除按钮的渲染
    - 实现 formatDate() 静态方法
    - 应用完成/未完成的不同视觉样式
    - _Requirements: 1.2, 1.3, 3.1, 4.1_
  
  - [x] 7.2 编写 TaskItemComponent 属性测试
    - **Property 1: Task List Rendering Completeness** - 验证所有任务字段都被渲染
    - **Property 2: Visual Distinction by Completion Status** - 验证完成状态的视觉区分
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 7.3 编写 TaskItemComponent 单元测试
    - 测试任务项渲染
    - 测试日期格式化
    - 测试完成/未完成样式
    - 测试事件处理器绑定
    - _Requirements: 1.2, 1.3_

- [x] 8. 实现 TaskListComponent
  - [x] 8.1 创建 TaskListComponent 类
    - 在 js/components/task-list.js 中实现 TaskListComponent 类
    - 实现 render() 方法，渲染任务列表（区分已完成和未完成）
    - 实现 renderEmptyState() 方法
    - 实现 renderLoading() 方法
    - 实现 renderError() 方法
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 6.4_
  
  - [x] 8.2 编写 TaskListComponent 单元测试
    - 测试任务列表渲染
    - 测试空状态显示
    - 测试加载状态显示
    - 测试错误状态显示
    - 测试已完成和未完成任务的分组
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 9. 实现 TaskFormComponent
  - [x] 9.1 创建 TaskFormComponent 类
    - 在 js/components/task-form.js 中实现 TaskFormComponent 类
    - 实现 render() 方法，渲染表单
    - 实现 handleSubmit() 方法，处理表单提交
    - 实现 showValidationError() 方法，显示验证错误
    - 实现 clearForm() 方法，清空表单
    - 实现 setSubmitting() 方法，设置提交状态
    - 实现实时输入验证
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 6.5, 8.3_
  
  - [x] 9.2 编写 TaskFormComponent 属性测试
    - **Property 16: Validation Error Field Association** - 验证验证错误与表单字段的关联
    - **Property 19: Real-time Form Validation** - 验证实时表单验证
    - **Validates: Requirements 2.5, 6.5, 8.3**
  
  - [x] 9.3 编写 TaskFormComponent 单元测试
    - 测试表单渲染
    - 测试表单提交
    - 测试验证错误显示
    - 测试表单清空
    - 测试提交状态
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 10. 实现 NotificationComponent
  - [x] 10.1 创建 NotificationComponent 类
    - 在 js/components/notification.js 中实现 NotificationComponent 类
    - 实现 showSuccess() 方法
    - 实现 showError() 方法
    - 实现 showInfo() 方法
    - 实现 close() 方法
    - 实现自动消失和手动关闭功能
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 10.2 编写 NotificationComponent 属性测试
    - **Property 14: Success Operation Feedback** - 验证成功操作的视觉反馈
    - **Validates: Requirements 6.3**
  
  - [x] 10.3 编写 NotificationComponent 单元测试
    - 测试成功消息显示
    - 测试错误消息显示
    - 测试信息消息显示
    - 测试自动消失
    - 测试手动关闭
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. 实现 UIController
  - [x] 11.1 创建 UIController 类
    - 在 js/ui-controller.js 中实现 UIController 类
    - 实现 init() 方法，初始化应用和加载任务
    - 实现 handleStateChange() 方法，处理状态变化并更新 UI
    - 实现 handleTaskToggle() 方法
    - 实现 handleTaskDelete() 方法
    - 实现 handleTaskCreate() 方法
    - 统一错误处理和用户反馈
    - _Requirements: 1.1, 2.3, 3.3, 4.3, 6.1, 6.3, 9.1, 9.2_
  
  - [x] 11.2 编写 UIController 属性测试
    - **Property 3: API Error Display** - 验证 API 错误的显示
    - **Property 15: Loading State Display** - 验证加载状态的显示
    - **Property 21: Concurrent Operation Consistency** - 验证并发操作的一致性
    - **Property 22: Failed Operation State Consistency** - 验证失败操作的状态一致性
    - **Property 23: API Request Deduplication** - 验证 API 请求去重
    - **Validates: Requirements 1.5, 2.6, 3.4, 6.1, 6.2, 6.4, 9.3, 9.4, 10.3**
  
  - [x] 11.3 编写 UIController 单元测试
    - 测试应用初始化
    - 测试状态变化处理
    - 测试用户操作协调
    - 测试错误处理和反馈
    - _Requirements: 1.1, 6.1, 6.3, 9.1_

- [x] 12. 实现主入口文件
  - 在 js/main.js 中实现应用入口逻辑
  - 初始化所有模块和组件
  - 连接 UIController 和各个组件
  - 处理 DOMContentLoaded 事件
  - _Requirements: 1.1, 9.2_

- [x] 13. Checkpoint - 所有 JavaScript 模块完成
  - 确保所有模块测试通过，如有问题请询问用户

- [x] 14. 实现 CSS 样式
  - [x] 14.1 创建 CSS 变量和基础样式
    - 在 css/variables.css 中定义 CSS 自定义属性（颜色、字体、间距）
    - 在 css/main.css 中实现基础样式和布局
    - 实现响应式布局（移动优先）
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.4_
  
  - [x] 14.2 创建组件样式
    - 在 css/components/task-list.css 中实现任务列表样式
    - 在 css/components/task-item.css 中实现任务项样式（包括完成/未完成状态）
    - 在 css/components/task-form.css 中实现表单样式
    - 在 css/components/notification.css 中实现通知样式
    - _Requirements: 1.3, 8.1, 8.2, 8.4_
  
  - [x] 14.3 实现交互状态样式
    - 实现悬停、聚焦、激活、禁用状态样式
    - 实现过渡和动画效果
    - 实现 prefers-reduced-motion 支持
    - _Requirements: 8.2, 10.2_
  
  - [x] 14.4 编写响应式布局属性测试
    - **Property 17: Responsive Layout Adaptation** - 验证响应式布局适配
    - **Validates: Requirements 7.3**

- [x] 15. 实现可访问性特性
  - [x] 15.1 添加 ARIA 标签和角色
    - 为所有交互元素添加 aria-label
    - 为表单字段添加 aria-required 和 aria-invalid
    - 为通知添加 role="alert" 和 aria-live
    - 为任务列表添加 role="list" 和 role="listitem"
    - _Requirements: 8.5_
  
  - [x] 15.2 实现键盘导航
    - 确保所有交互元素可通过 Tab 键访问
    - 实现 Enter 键提交表单
    - 实现 Escape 键关闭通知
    - 添加可见的焦点指示器
    - _Requirements: 8.5_
  
  - [x] 15.3 编写可访问性属性测试
    - **Property 18: Interactive Element States** - 验证交互元素的状态
    - **Property 20: Accessibility Labels** - 验证可访问性标签
    - **Validates: Requirements 8.2, 8.5**

- [x] 16. 性能优化
  - 实现 API 请求去重逻辑
  - 优化 DOM 操作（批量更新）
  - 实现输入验证防抖
  - 确保初始加载时间 < 2 秒
  - 确保交互响应时间 < 100 毫秒
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 17. 最终集成测试
  - [x] 17.1 编写端到端用户流程测试
    - 测试完整的任务创建流程
    - 测试任务状态切换流程
    - 测试任务删除流程
    - 测试错误场景处理
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.2, 3.3, 4.2, 4.3_
  
  - [x] 17.2 跨浏览器兼容性测试
    - 在 Chrome、Firefox、Safari、Edge 上测试
    - 在移动设备浏览器上测试
    - _Requirements: 7.4_

- [x] 18. Final Checkpoint - 完成所有测试
  - 确保所有测试通过，代码覆盖率达到目标（>80%），如有问题请询问用户

## Notes

- 标记 `*` 的任务为可选任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求条款，确保可追溯性
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
- 使用原生 HTML/CSS/JavaScript，无需构建工具
- 所有代码应遵循 ES6+ 标准和最佳实践
