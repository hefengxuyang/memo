# 需求文档

## 简介

本功能为待办事项应用添加任务列表展示和任务更新功能。目前前端已实现任务创建功能，但缺少任务列表的展示和任务内容的更新能力。本需求旨在完善这两个核心功能，使用户能够查看所有任务并编辑任务的标题和描述。

## 术语表

- **Frontend**: 前端应用，负责用户界面展示和交互
- **Backend**: 后端服务，提供 RESTful API 接口
- **Task_List_Component**: 任务列表组件，负责渲染任务列表
- **Task_Service**: 任务服务层，处理业务逻辑
- **API_Client**: API 客户端，负责与后端通信
- **Task**: 任务对象，包含 id、title、description、completed、created_at 字段
- **Update_Task_Request**: 更新任务的请求对象，包含 title 和 description 字段

## 需求

### 需求 1: 任务列表展示

**用户故事:** 作为用户，我希望能够看到所有已创建的任务列表，以便了解当前的待办事项。

#### 验收标准

1. WHEN 应用初始化完成，THE Frontend SHALL 自动加载并展示所有任务
2. WHEN 任务列表为空，THE Task_List_Component SHALL 展示空状态提示信息
3. WHEN 任务列表加载中，THE Task_List_Component SHALL 展示加载状态指示器
4. WHEN 任务列表加载失败，THE Task_List_Component SHALL 展示错误信息
5. THE Task_List_Component SHALL 将任务分为"待办任务"和"已完成"两个区域展示
6. THE Task_List_Component SHALL 在每个区域标题中显示该区域的任务数量
7. THE Task_List_Component SHALL 按创建时间倒序排列任务（最新的在前）
8. FOR ALL 任务项，THE Task_List_Component SHALL 展示任务的标题、描述、完成状态和创建时间
9. WHEN 用户创建新任务，THE Task_List_Component SHALL 自动更新展示新任务
10. WHEN 用户切换任务完成状态，THE Task_List_Component SHALL 自动将任务移动到对应区域

### 需求 2: 任务更新功能

**用户故事:** 作为用户，我希望能够编辑已创建任务的标题和描述，以便修正错误或更新任务信息。

#### 验收标准

1. THE Frontend SHALL 为每个任务项提供编辑按钮
2. WHEN 用户点击编辑按钮，THE Frontend SHALL 展示任务编辑表单
3. THE Frontend SHALL 在编辑表单中预填充任务的当前标题和描述
4. WHEN 用户修改标题或描述后提交，THE Task_Service SHALL 验证输入数据
5. WHEN 标题为空或仅包含空格，THE Frontend SHALL 显示验证错误信息并阻止提交
6. WHEN 标题长度超过 200 个字符，THE Frontend SHALL 显示验证错误信息并阻止提交
7. WHEN 描述长度超过 1000 个字符，THE Frontend SHALL 显示验证错误信息并阻止提交
8. WHEN 输入验证通过，THE Task_Service SHALL 调用 Backend API 更新任务
9. WHEN 任务更新成功，THE Frontend SHALL 更新任务列表展示并显示成功提示
10. WHEN 任务更新失败，THE Frontend SHALL 显示错误信息并保持编辑状态
11. THE Frontend SHALL 提供取消编辑功能，恢复到查看模式
12. WHEN 用户取消编辑，THE Frontend SHALL 丢弃未保存的修改

### 需求 3: 后端 API 支持

**用户故事:** 作为前端开发者，我需要后端提供任务更新 API，以便实现任务编辑功能。

#### 验收标准

1. THE Backend SHALL 提供 PUT /api/tasks/{id} 接口用于更新任务
2. WHEN 接收到更新请求，THE Backend SHALL 验证任务 ID 是否有效
3. WHEN 任务 ID 无效或任务不存在，THE Backend SHALL 返回 404 状态码和错误信息
4. WHEN 接收到更新请求，THE Backend SHALL 验证请求体中的 title 字段非空
5. WHEN title 字段为空或仅包含空格，THE Backend SHALL 返回 400 状态码和验证错误信息
6. WHEN 输入验证通过，THE Backend SHALL 更新数据库中的任务记录
7. WHEN 任务更新成功，THE Backend SHALL 返回 200 状态码和更新后的任务对象
8. WHEN 数据库操作失败，THE Backend SHALL 返回 500 状态码和错误信息
9. THE Backend SHALL 保持任务的 id、completed 和 created_at 字段不变
10. THE Backend SHALL 仅更新 title 和 description 字段

### 需求 4: 用户体验优化

**用户故事:** 作为用户，我希望任务列表和编辑功能具有良好的交互体验，以便高效地管理任务。

#### 验收标准

1. WHEN 用户提交更新请求，THE Frontend SHALL 禁用提交按钮防止重复提交
2. WHEN 更新操作进行中，THE Frontend SHALL 显示加载指示器
3. THE Frontend SHALL 在 2 秒内完成任务列表的初始加载和渲染
4. THE Frontend SHALL 支持键盘导航，用户可以使用 Tab 键在任务列表和编辑表单中导航
5. THE Frontend SHALL 支持 Escape 键取消编辑操作
6. THE Frontend SHALL 为所有交互元素提供适当的 ARIA 标签以支持屏幕阅读器
7. WHEN 任务更新成功，THE Frontend SHALL 显示成功通知消息持续 3 秒
8. WHEN 任务更新失败，THE Frontend SHALL 显示错误通知消息直到用户关闭
9. THE Frontend SHALL 在编辑模式下自动聚焦到标题输入框
10. THE Frontend SHALL 实时验证输入并显示字符计数提示
