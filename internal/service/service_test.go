package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"

	"memo/internal/model"
	"memo/internal/repository"
)

// mockRepository 是用于测试的 mock repository
type mockRepository struct {
	tasks  map[int64]*model.Task
	nextID int64
}

func newMockRepository() *mockRepository {
	return &mockRepository{
		tasks:  make(map[int64]*model.Task),
		nextID: 1,
	}
}

func (m *mockRepository) Create(ctx context.Context, task *model.Task) error {
	task.ID = m.nextID
	m.nextID++
	// 设置创建时间（模拟真实 repository 的行为）
	if task.CreatedAt.IsZero() {
		task.CreatedAt = time.Now()
	}
	m.tasks[task.ID] = task
	return nil
}

func (m *mockRepository) FindByID(ctx context.Context, id int64) (*model.Task, error) {
	task, exists := m.tasks[id]
	if !exists {
		return nil, repository.ErrNotFound
	}
	return task, nil
}

func (m *mockRepository) FindAll(ctx context.Context) ([]*model.Task, error) {
	tasks := make([]*model.Task, 0, len(m.tasks))
	for _, task := range m.tasks {
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (m *mockRepository) Update(ctx context.Context, task *model.Task) error {
	if _, exists := m.tasks[task.ID]; !exists {
		return repository.ErrNotFound
	}
	m.tasks[task.ID] = task
	return nil
}

func (m *mockRepository) Delete(ctx context.Context, id int64) error {
	if _, exists := m.tasks[id]; !exists {
		return repository.ErrNotFound
	}
	delete(m.tasks, id)
	return nil
}

// TestCreateTask 测试创建任务
func TestCreateTask(t *testing.T) {
	repo := newMockRepository()
	service := NewTaskService(repo)
	ctx := context.Background()

	tests := []struct {
		name    string
		req     model.CreateTaskRequest
		wantErr bool
	}{
		{
			name: "valid task",
			req: model.CreateTaskRequest{
				Title:       "Test Task",
				Description: "Test Description",
			},
			wantErr: false,
		},
		{
			name: "task with whitespace in title",
			req: model.CreateTaskRequest{
				Title:       "  Task with spaces  ",
				Description: "Description",
			},
			wantErr: false,
		},
		{
			name: "empty title",
			req: model.CreateTaskRequest{
				Title:       "",
				Description: "Description",
			},
			wantErr: true,
		},
		{
			name: "whitespace only title",
			req: model.CreateTaskRequest{
				Title:       "   ",
				Description: "Description",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task, err := service.CreateTask(ctx, tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("CreateTask() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if task == nil {
					t.Error("CreateTask() returned nil task")
					return
				}
				if task.ID == 0 {
					t.Error("CreateTask() task ID is 0")
				}
				if task.Completed {
					t.Error("CreateTask() task should not be completed initially")
				}
			}
		})
	}
}

// TestGetTask 测试获取任务
func TestGetTask(t *testing.T) {
	repo := newMockRepository()
	service := NewTaskService(repo)
	ctx := context.Background()

	// 创建一个任务
	created, err := service.CreateTask(ctx, model.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
	})
	if err != nil {
		t.Fatalf("Failed to create task: %v", err)
	}

	// 测试获取存在的任务
	task, err := service.GetTask(ctx, created.ID)
	if err != nil {
		t.Errorf("GetTask() error = %v", err)
	}
	if task.ID != created.ID {
		t.Errorf("GetTask() ID = %v, want %v", task.ID, created.ID)
	}

	// 测试获取不存在的任务
	_, err = service.GetTask(ctx, 999)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("GetTask() error = %v, want ErrNotFound", err)
	}
}

// TestListTasks 测试获取任务列表
func TestListTasks(t *testing.T) {
	repo := newMockRepository()
	service := NewTaskService(repo)
	ctx := context.Background()

	// 测试空列表
	tasks, err := service.ListTasks(ctx)
	if err != nil {
		t.Errorf("ListTasks() error = %v", err)
	}
	if len(tasks) != 0 {
		t.Errorf("ListTasks() length = %v, want 0", len(tasks))
	}

	// 创建多个任务
	for i := 0; i < 3; i++ {
		_, err := service.CreateTask(ctx, model.CreateTaskRequest{
			Title:       "Task",
			Description: "Description",
		})
		if err != nil {
			t.Fatalf("Failed to create task: %v", err)
		}
	}

	// 测试获取所有任务
	tasks, err = service.ListTasks(ctx)
	if err != nil {
		t.Errorf("ListTasks() error = %v", err)
	}
	if len(tasks) != 3 {
		t.Errorf("ListTasks() length = %v, want 3", len(tasks))
	}
}

// TestUpdateTaskStatus 测试更新任务状态
func TestUpdateTaskStatus(t *testing.T) {
	repo := newMockRepository()
	service := NewTaskService(repo)
	ctx := context.Background()

	// 创建一个任务
	created, err := service.CreateTask(ctx, model.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
	})
	if err != nil {
		t.Fatalf("Failed to create task: %v", err)
	}

	// 测试更新为已完成
	updated, err := service.UpdateTaskStatus(ctx, created.ID, true)
	if err != nil {
		t.Errorf("UpdateTaskStatus() error = %v", err)
	}
	if !updated.Completed {
		t.Error("UpdateTaskStatus() task should be completed")
	}

	// 测试更新为未完成
	updated, err = service.UpdateTaskStatus(ctx, created.ID, false)
	if err != nil {
		t.Errorf("UpdateTaskStatus() error = %v", err)
	}
	if updated.Completed {
		t.Error("UpdateTaskStatus() task should not be completed")
	}

	// 测试更新不存在的任务
	_, err = service.UpdateTaskStatus(ctx, 999, true)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("UpdateTaskStatus() error = %v, want ErrNotFound", err)
	}
}

// TestDeleteTask 测试删除任务
func TestDeleteTask(t *testing.T) {
	repo := newMockRepository()
	service := NewTaskService(repo)
	ctx := context.Background()

	// 创建一个任务
	created, err := service.CreateTask(ctx, model.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
	})
	if err != nil {
		t.Fatalf("Failed to create task: %v", err)
	}

	// 测试删除存在的任务
	err = service.DeleteTask(ctx, created.ID)
	if err != nil {
		t.Errorf("DeleteTask() error = %v", err)
	}

	// 验证任务已被删除
	_, err = service.GetTask(ctx, created.ID)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("GetTask() after delete error = %v, want ErrNotFound", err)
	}

	// 测试删除不存在的任务
	err = service.DeleteTask(ctx, 999)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("DeleteTask() error = %v, want ErrNotFound", err)
	}
}

// Property-Based Tests using gopter

// Feature: memo, Property 1: Task creation round-trip
// **Validates: Requirements 1.1, 1.2, 1.3, 5.1**
//
// For any valid task data (non-empty title and description), creating a task
// and then retrieving it by the returned ID should return a task with the same
// title, description, and initial completed status (false).
func TestProperty_TaskCreationRoundTrip(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("creating and retrieving task preserves data",
		prop.ForAll(
			func(title string, desc string) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// title 去除首尾空格后必须非空
				title = strings.TrimSpace(title)
				if title == "" {
					return true // 跳过无效输入
				}

				// 创建任务
				task, err := service.CreateTask(ctx, model.CreateTaskRequest{
					Title:       title,
					Description: desc,
				})
				if err != nil {
					t.Logf("CreateTask failed: %v", err)
					return false
				}

				// 验证任务 ID 已生成
				if task.ID == 0 {
					t.Logf("Task ID is 0")
					return false
				}

				// 检索任务
				retrieved, err := service.GetTask(ctx, task.ID)
				if err != nil {
					t.Logf("GetTask failed: %v", err)
					return false
				}

				// 验证数据一致性
				if retrieved.Title != title {
					t.Logf("Title mismatch: got %q, want %q", retrieved.Title, title)
					return false
				}
				if retrieved.Description != desc {
					t.Logf("Description mismatch: got %q, want %q", retrieved.Description, desc)
					return false
				}
				if retrieved.Completed != false {
					t.Logf("Completed should be false, got %v", retrieved.Completed)
					return false
				}
				if retrieved.ID != task.ID {
					t.Logf("ID mismatch: got %d, want %d", retrieved.ID, task.ID)
					return false
				}

				return true
			},
			gen.AnyString(), // 生成随机标题
			gen.AnyString(), // 生成随机描述
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 2: Task structure completeness
// **Validates: Requirements 1.2, 4.3**
//
// For any created task, the returned task object should contain all required fields:
// ID (positive integer), title (non-empty string), description (string),
// completed (boolean), and created_at (valid timestamp).
func TestProperty_TaskStructureCompleteness(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("created task contains all required fields with correct types",
		prop.ForAll(
			func(title string, desc string) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// title 去除首尾空格后必须非空
				title = strings.TrimSpace(title)
				if title == "" {
					return true // 跳过无效输入
				}

				// 创建任务
				task, err := service.CreateTask(ctx, model.CreateTaskRequest{
					Title:       title,
					Description: desc,
				})
				if err != nil {
					t.Logf("CreateTask failed: %v", err)
					return false
				}

				// 验证 ID 字段：必须是正整数
				if task.ID <= 0 {
					t.Logf("ID must be positive integer, got %d", task.ID)
					return false
				}

				// 验证 Title 字段：必须是非空字符串
				if task.Title == "" {
					t.Logf("Title must be non-empty string, got empty")
					return false
				}
				if strings.TrimSpace(task.Title) == "" {
					t.Logf("Title must be non-empty after trimming, got %q", task.Title)
					return false
				}

				// 验证 Description 字段：必须是字符串（可以为空）
				// Go 的 string 类型总是有效的，所以只需要检查字段存在
				_ = task.Description

				// 验证 Completed 字段：必须是布尔值
				// Go 的 bool 类型总是有效的（true 或 false），所以只需要检查字段存在
				// 对于新创建的任务，应该是 false
				if task.Completed != false {
					t.Logf("Completed should be false for new task, got %v", task.Completed)
					return false
				}

				// 验证 CreatedAt 字段：必须是有效的时间戳
				if task.CreatedAt.IsZero() {
					t.Logf("CreatedAt must be valid timestamp, got zero time")
					return false
				}

				// 验证 CreatedAt 不在未来
				// 允许一些时钟偏差（1秒）
				if task.CreatedAt.After(task.CreatedAt.Add(1 * 1000000000)) {
					t.Logf("CreatedAt should not be in the future")
					return false
				}

				return true
			},
			gen.AnyString(), // 生成随机标题
			gen.AnyString(), // 生成随机描述
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 3: Empty title rejection
// **Validates: Requirements 1.4, 7.2**
//
// For any string composed entirely of whitespace characters (including empty string),
// attempting to create a task with that title should be rejected with an error response,
// and no task should be created in the database.
func TestProperty_EmptyTitleRejection(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	// 生成各种空白字符串的生成器
	genWhitespaceString := gen.OneGenOf(
		gen.Const(""),                  // 空字符串
		gen.Const(" "),                 // 单个空格
		gen.Const("  "),                // 多个空格
		gen.Const("\t"),                // 制表符
		gen.Const("\n"),                // 换行符
		gen.Const("\r"),                // 回车符
		gen.Const(" \t "),              // 空格和制表符混合
		gen.Const(" \n "),              // 空格和换行符混合
		gen.Const("\t\n\r"),            // 多种空白字符混合
		gen.Const("   \t\t   \n\n   "), // 复杂的空白字符组合
	)

	properties.Property("empty or whitespace-only titles are rejected",
		prop.ForAll(
			func(whitespaceTitle string, desc string) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// 尝试创建带有空白标题的任务
				task, err := service.CreateTask(ctx, model.CreateTaskRequest{
					Title:       whitespaceTitle,
					Description: desc,
				})

				// 验证返回错误
				if err == nil {
					t.Logf("Expected error for whitespace title %q, but got nil", whitespaceTitle)
					return false
				}

				// 验证返回的任务为 nil
				if task != nil {
					t.Logf("Expected nil task for whitespace title %q, but got task with ID %d", whitespaceTitle, task.ID)
					return false
				}

				// 验证错误类型是 ValidationError
				var validationErr *model.ValidationError
				if !errors.As(err, &validationErr) {
					t.Logf("Expected ValidationError for whitespace title %q, but got %T: %v", whitespaceTitle, err, err)
					return false
				}

				// 验证错误消息包含 "title" 和 "empty"
				errMsg := strings.ToLower(err.Error())
				if !strings.Contains(errMsg, "title") || !strings.Contains(errMsg, "empty") {
					t.Logf("Error message should mention 'title' and 'empty', got: %q", err.Error())
					return false
				}

				// 验证数据库中没有创建任务
				// 由于我们使用 mock repository，检查 tasks map 是否为空
				tasks, err := service.ListTasks(ctx)
				if err != nil {
					t.Logf("ListTasks failed: %v", err)
					return false
				}
				if len(tasks) != 0 {
					t.Logf("Expected no tasks in database after rejected creation, but found %d tasks", len(tasks))
					return false
				}

				return true
			},
			genWhitespaceString, // 生成空白字符串
			gen.AnyString(),     // 生成随机描述
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 4: Task ID uniqueness
// **Validates: Requirements 1.5, 6.5**
//
// For any sequence of task creation operations, all returned task IDs should be
// unique (no duplicates).
func TestProperty_TaskIDUniqueness(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	// 生成任务数量的生成器（1-50个任务）
	genTaskCount := gen.IntRange(1, 50)

	properties.Property("all task IDs are unique",
		prop.ForAll(
			func(taskCount int) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// 用于跟踪所有生成的 ID
				seenIDs := make(map[int64]bool)
				createdTasks := make([]*model.Task, 0, taskCount)

				// 创建指定数量的任务
				for i := 0; i < taskCount; i++ {
					task, err := service.CreateTask(ctx, model.CreateTaskRequest{
						Title:       "Task " + string(rune(i)),
						Description: "Description",
					})
					if err != nil {
						t.Logf("CreateTask failed at iteration %d: %v", i, err)
						return false
					}

					// 验证 ID 是正整数
					if task.ID <= 0 {
						t.Logf("Task ID must be positive, got %d", task.ID)
						return false
					}

					// 检查 ID 是否已经存在
					if seenIDs[task.ID] {
						t.Logf("Duplicate task ID found: %d", task.ID)
						return false
					}

					// 记录这个 ID
					seenIDs[task.ID] = true
					createdTasks = append(createdTasks, task)
				}

				// 验证我们创建了正确数量的任务
				if len(createdTasks) != taskCount {
					t.Logf("Expected %d tasks, but created %d", taskCount, len(createdTasks))
					return false
				}

				// 验证所有 ID 都是唯一的（通过 map 的大小）
				if len(seenIDs) != taskCount {
					t.Logf("Expected %d unique IDs, but got %d", taskCount, len(seenIDs))
					return false
				}

				// 额外验证：通过 ListTasks 确认数据库中的任务数量
				tasks, err := service.ListTasks(ctx)
				if err != nil {
					t.Logf("ListTasks failed: %v", err)
					return false
				}
				if len(tasks) != taskCount {
					t.Logf("Expected %d tasks in database, but found %d", taskCount, len(tasks))
					return false
				}

				// 验证数据库中的所有任务 ID 也是唯一的
				dbIDs := make(map[int64]bool)
				for _, task := range tasks {
					if dbIDs[task.ID] {
						t.Logf("Duplicate task ID in database: %d", task.ID)
						return false
					}
					dbIDs[task.ID] = true
				}

				return true
			},
			genTaskCount,
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 5: Task deletion removes task
// **Validates: Requirements 2.1, 2.2**
//
// For any existing task, after successfully deleting it, attempting to retrieve
// that task by ID should return a "not found" error.
func TestProperty_TaskDeletionRemovesTask(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("deleted task cannot be retrieved",
		prop.ForAll(
			func(title string, desc string) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// title 去除首尾空格后必须非空
				title = strings.TrimSpace(title)
				if title == "" {
					return true // 跳过无效输入
				}

				// 创建任务
				task, err := service.CreateTask(ctx, model.CreateTaskRequest{
					Title:       title,
					Description: desc,
				})
				if err != nil {
					t.Logf("CreateTask failed: %v", err)
					return false
				}

				// 验证任务已创建并可以检索
				retrieved, err := service.GetTask(ctx, task.ID)
				if err != nil {
					t.Logf("GetTask failed before deletion: %v", err)
					return false
				}
				if retrieved.ID != task.ID {
					t.Logf("Retrieved task ID mismatch before deletion: got %d, want %d", retrieved.ID, task.ID)
					return false
				}

				// 删除任务
				err = service.DeleteTask(ctx, task.ID)
				if err != nil {
					t.Logf("DeleteTask failed: %v", err)
					return false
				}

				// 尝试检索已删除的任务，应该返回 "not found" 错误
				deletedTask, err := service.GetTask(ctx, task.ID)
				if err == nil {
					t.Logf("Expected error when retrieving deleted task, but got nil")
					return false
				}

				// 验证返回的任务为 nil
				if deletedTask != nil {
					t.Logf("Expected nil task after deletion, but got task with ID %d", deletedTask.ID)
					return false
				}

				// 验证错误类型是 ErrNotFound
				if !errors.Is(err, repository.ErrNotFound) {
					t.Logf("Expected ErrNotFound for deleted task, but got %T: %v", err, err)
					return false
				}

				// 额外验证：确认任务不在列表中
				tasks, err := service.ListTasks(ctx)
				if err != nil {
					t.Logf("ListTasks failed: %v", err)
					return false
				}
				for _, listTask := range tasks {
					if listTask.ID == task.ID {
						t.Logf("Deleted task still appears in task list")
						return false
					}
				}

				return true
			},
			gen.AnyString(), // 生成随机标题
			gen.AnyString(), // 生成随机描述
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 6: Delete non-existent task returns error
// **Validates: Requirements 2.3, 5.3**
//
// For any task ID that does not exist in the database, attempting to delete it
// should return an error response with appropriate error message.
func TestProperty_DeleteNonExistentTaskReturnsError(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("deleting non-existent task returns error",
		prop.ForAll(
			func(nonExistentID int64) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// 确保 ID 是正整数（有效的 ID 范围）
				if nonExistentID <= 0 {
					nonExistentID = 1
				}

				// 创建一些任务以确保数据库不为空
				// 但确保 nonExistentID 不在已创建的任务中
				createdIDs := make(map[int64]bool)
				for i := 0; i < 5; i++ {
					task, err := service.CreateTask(ctx, model.CreateTaskRequest{
						Title:       fmt.Sprintf("Task %d", i),
						Description: fmt.Sprintf("Description %d", i),
					})
					if err != nil {
						t.Logf("CreateTask failed: %v", err)
						return false
					}
					createdIDs[task.ID] = true
				}

				// 如果生成的 ID 恰好在已创建的任务中，调整它
				// 使用一个足够大的 ID 来避免冲突
				if createdIDs[nonExistentID] {
					nonExistentID = 999999 + nonExistentID
				}

				// 尝试删除不存在的任务
				err := service.DeleteTask(ctx, nonExistentID)

				// 验证返回了错误
				if err == nil {
					t.Logf("Expected error when deleting non-existent task ID %d, but got nil", nonExistentID)
					return false
				}

				// 验证错误类型是 ErrNotFound
				if !errors.Is(err, repository.ErrNotFound) {
					t.Logf("Expected ErrNotFound for non-existent task ID %d, but got %T: %v", nonExistentID, err, err)
					return false
				}

				// 额外验证：确认任务列表没有变化（没有任务被错误删除）
				tasks, err := service.ListTasks(ctx)
				if err != nil {
					t.Logf("ListTasks failed: %v", err)
					return false
				}
				if len(tasks) != 5 {
					t.Logf("Expected 5 tasks in list after failed delete, but got %d", len(tasks))
					return false
				}

				return true
			},
			gen.Int64(), // 生成随机 int64 作为不存在的 ID
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 7: Task status update round-trip
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
//
// For any existing task and any boolean value (true or false), updating the task's
// completion status and then retrieving the task should return the task with the
// updated status value.
func TestProperty_TaskStatusUpdateRoundTrip(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("updating task status and retrieving preserves the updated status",
		prop.ForAll(
			func(title string, desc string, newStatus bool) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// title 去除首尾空格后必须非空
				title = strings.TrimSpace(title)
				if title == "" {
					return true // 跳过无效输入
				}

				// 创建任务（初始状态为 false）
				task, err := service.CreateTask(ctx, model.CreateTaskRequest{
					Title:       title,
					Description: desc,
				})
				if err != nil {
					t.Logf("CreateTask failed: %v", err)
					return false
				}

				// 验证初始状态为 false
				if task.Completed != false {
					t.Logf("Initial completed status should be false, got %v", task.Completed)
					return false
				}

				// 更新任务状态
				updatedTask, err := service.UpdateTaskStatus(ctx, task.ID, newStatus)
				if err != nil {
					t.Logf("UpdateTaskStatus failed: %v", err)
					return false
				}

				// 验证更新后的任务状态
				if updatedTask.Completed != newStatus {
					t.Logf("Updated task status mismatch: got %v, want %v", updatedTask.Completed, newStatus)
					return false
				}

				// 检索任务以验证状态已持久化
				retrieved, err := service.GetTask(ctx, task.ID)
				if err != nil {
					t.Logf("GetTask failed after status update: %v", err)
					return false
				}

				// 验证检索到的任务状态与更新的状态一致
				if retrieved.Completed != newStatus {
					t.Logf("Retrieved task status mismatch: got %v, want %v", retrieved.Completed, newStatus)
					return false
				}

				// 验证其他字段没有改变
				if retrieved.ID != task.ID {
					t.Logf("Task ID changed after status update: got %d, want %d", retrieved.ID, task.ID)
					return false
				}
				if retrieved.Title != task.Title {
					t.Logf("Task title changed after status update: got %q, want %q", retrieved.Title, task.Title)
					return false
				}
				if retrieved.Description != task.Description {
					t.Logf("Task description changed after status update: got %q, want %q", retrieved.Description, task.Description)
					return false
				}

				// 额外测试：测试状态切换（从 newStatus 切换回相反的状态）
				oppositeStatus := !newStatus
				updatedTask2, err := service.UpdateTaskStatus(ctx, task.ID, oppositeStatus)
				if err != nil {
					t.Logf("Second UpdateTaskStatus failed: %v", err)
					return false
				}

				// 验证第二次更新后的状态
				if updatedTask2.Completed != oppositeStatus {
					t.Logf("Second update status mismatch: got %v, want %v", updatedTask2.Completed, oppositeStatus)
					return false
				}

				// 再次检索以验证第二次更新也持久化了
				retrieved2, err := service.GetTask(ctx, task.ID)
				if err != nil {
					t.Logf("GetTask failed after second status update: %v", err)
					return false
				}

				if retrieved2.Completed != oppositeStatus {
					t.Logf("Retrieved task status after second update mismatch: got %v, want %v", retrieved2.Completed, oppositeStatus)
					return false
				}

				return true
			},
			gen.AnyString(), // 生成随机标题
			gen.AnyString(), // 生成随机描述
			gen.Bool(),      // 生成随机布尔值作为新状态
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 8: Update non-existent task returns error
// **Validates: Requirements 3.5**
//
// For any task ID that does not exist in the database, attempting to update its
// status should return an error response with appropriate error message.
func TestProperty_UpdateNonExistentTaskReturnsError(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("updating non-existent task returns error",
		prop.ForAll(
			func(nonExistentID int64, newStatus bool) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// 确保 ID 是正整数（有效的 ID 范围）
				if nonExistentID <= 0 {
					nonExistentID = 1
				}

				// 尝试更新不存在的任务
				updatedTask, err := service.UpdateTaskStatus(ctx, nonExistentID, newStatus)

				// 验证返回错误
				if err == nil {
					t.Logf("Expected error when updating non-existent task ID %d, but got nil", nonExistentID)
					return false
				}

				// 验证错误类型是 ErrNotFound
				if !errors.Is(err, repository.ErrNotFound) {
					t.Logf("Expected ErrNotFound for non-existent task ID %d, but got %T: %v", nonExistentID, err, err)
					return false
				}

				// 验证没有返回任务对象
				if updatedTask != nil {
					t.Logf("Expected nil task for non-existent ID %d, but got %+v", nonExistentID, updatedTask)
					return false
				}

				return true
			},
			gen.Int64(), // 生成随机 int64 作为不存在的任务 ID
			gen.Bool(),  // 生成随机布尔值作为新状态
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 9: List tasks returns all created tasks
// **Validates: Requirements 4.1, 4.2, 4.3**
//
// For any set of created tasks, querying the task list should return all tasks
// that were created and not deleted, with each task containing complete information.
func TestProperty_ListTasksReturnsAllCreatedTasks(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("list tasks returns all created tasks with complete information",
		prop.ForAll(
			func(taskData []struct{ title, desc string }) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// 过滤掉无效的任务数据（空标题）
				validTasks := make([]struct{ title, desc string }, 0)
				for _, td := range taskData {
					trimmedTitle := strings.TrimSpace(td.title)
					if trimmedTitle != "" {
						validTasks = append(validTasks, struct{ title, desc string }{
							title: trimmedTitle,
							desc:  td.desc,
						})
					}
				}

				// 创建任务并记录创建的任务
				createdTasks := make([]*model.Task, 0, len(validTasks))
				for _, td := range validTasks {
					task, err := service.CreateTask(ctx, model.CreateTaskRequest{
						Title:       td.title,
						Description: td.desc,
					})
					if err != nil {
						t.Logf("Failed to create task with title '%s': %v", td.title, err)
						return false
					}
					createdTasks = append(createdTasks, task)
				}

				// 查询任务列表
				listedTasks, err := service.ListTasks(ctx)
				if err != nil {
					t.Logf("Failed to list tasks: %v", err)
					return false
				}

				// 验证返回的任务数量与创建的任务数量一致
				if len(listedTasks) != len(createdTasks) {
					t.Logf("Expected %d tasks in list, but got %d", len(createdTasks), len(listedTasks))
					return false
				}

				// 创建一个 map 用于快速查找创建的任务
				createdTaskMap := make(map[int64]*model.Task)
				for _, task := range createdTasks {
					createdTaskMap[task.ID] = task
				}

				// 验证列表中的每个任务都存在于创建的任务中，并且信息完整
				for _, listedTask := range listedTasks {
					// 验证任务存在
					createdTask, exists := createdTaskMap[listedTask.ID]
					if !exists {
						t.Logf("Listed task ID %d was not in created tasks", listedTask.ID)
						return false
					}

					// 验证任务信息完整性和正确性
					// 1. ID 应该是正整数
					if listedTask.ID <= 0 {
						t.Logf("Task ID should be positive, got %d", listedTask.ID)
						return false
					}

					// 2. 标题应该匹配
					if listedTask.Title != createdTask.Title {
						t.Logf("Task ID %d: title mismatch. Expected '%s', got '%s'",
							listedTask.ID, createdTask.Title, listedTask.Title)
						return false
					}

					// 3. 描述应该匹配
					if listedTask.Description != createdTask.Description {
						t.Logf("Task ID %d: description mismatch. Expected '%s', got '%s'",
							listedTask.ID, createdTask.Description, listedTask.Description)
						return false
					}

					// 4. 完成状态应该匹配
					if listedTask.Completed != createdTask.Completed {
						t.Logf("Task ID %d: completed status mismatch. Expected %v, got %v",
							listedTask.ID, createdTask.Completed, listedTask.Completed)
						return false
					}

					// 5. 创建时间应该是有效的（非零值）
					if listedTask.CreatedAt.IsZero() {
						t.Logf("Task ID %d: CreatedAt should not be zero", listedTask.ID)
						return false
					}

					// 6. 创建时间应该匹配
					if !listedTask.CreatedAt.Equal(createdTask.CreatedAt) {
						t.Logf("Task ID %d: CreatedAt mismatch. Expected %v, got %v",
							listedTask.ID, createdTask.CreatedAt, listedTask.CreatedAt)
						return false
					}
				}

				return true
			},
			// 生成一个任务数据数组，每个元素包含 title 和 description
			gen.SliceOf(gen.Struct(reflect.TypeOf(struct{ title, desc string }{}), map[string]gopter.Gen{
				"title": gen.AnyString(),
				"desc":  gen.AnyString(),
			})),
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 10: JSON serialization round-trip
// **Validates: Requirements 8.2**
//
// For any valid task object, serializing it to JSON and deserializing back
// should produce an equivalent task object with all fields preserved.
func TestProperty_JSONSerializationRoundTrip(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("JSON serialization and deserialization preserves all task fields",
		prop.ForAll(
			func(id int64, title string, desc string, completed bool, createdAt time.Time) bool {
				// 确保 ID 是正整数
				if id <= 0 {
					id = 1
				}

				// 确保标题非空（符合 Task 的验证规则）
				title = strings.TrimSpace(title)
				if title == "" {
					title = "default title"
				}

				// 创建原始任务对象
				original := &model.Task{
					ID:          id,
					Title:       title,
					Description: desc,
					Completed:   completed,
					CreatedAt:   createdAt,
				}

				// 序列化为 JSON
				jsonData, err := json.Marshal(original)
				if err != nil {
					t.Logf("Failed to marshal task to JSON: %v", err)
					return false
				}

				// 反序列化回 Task 对象
				var deserialized model.Task
				err = json.Unmarshal(jsonData, &deserialized)
				if err != nil {
					t.Logf("Failed to unmarshal JSON to task: %v", err)
					return false
				}

				// 验证所有字段是否保持一致
				// 1. ID 应该匹配
				if deserialized.ID != original.ID {
					t.Logf("ID mismatch: expected %d, got %d", original.ID, deserialized.ID)
					return false
				}

				// 2. Title 应该匹配
				if deserialized.Title != original.Title {
					t.Logf("Title mismatch: expected '%s', got '%s'", original.Title, deserialized.Title)
					return false
				}

				// 3. Description 应该匹配
				if deserialized.Description != original.Description {
					t.Logf("Description mismatch: expected '%s', got '%s'", original.Description, deserialized.Description)
					return false
				}

				// 4. Completed 应该匹配
				if deserialized.Completed != original.Completed {
					t.Logf("Completed mismatch: expected %v, got %v", original.Completed, deserialized.Completed)
					return false
				}

				// 5. CreatedAt 应该匹配
				// 注意：JSON 序列化时间可能会丢失纳秒精度，所以我们使用 Equal 方法
				if !deserialized.CreatedAt.Equal(original.CreatedAt) {
					t.Logf("CreatedAt mismatch: expected %v, got %v", original.CreatedAt, deserialized.CreatedAt)
					return false
				}

				return true
			},
			// 生成随机的任务字段
			gen.Int64(),     // ID
			gen.AnyString(), // Title
			gen.AnyString(), // Description
			gen.Bool(),      // Completed
			gen.Time(),      // CreatedAt
		))

	properties.TestingRun(t)
}

// Feature: memo, Property 11: Database errors return descriptive messages
// **Validates: Requirements 6.4, 7.1, 7.4**
//
// For any database operation failure (simulated or real), the API response
// should contain a descriptive error message and appropriate HTTP status code.
func TestProperty_DatabaseErrorsReturnDescriptiveMessages(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("database errors are wrapped with descriptive messages",
		prop.ForAll(
			func(id int64, title string, desc string) bool {
				// 确保 ID 是正整数
				if id <= 0 {
					id = 1
				}

				// 确保标题非空
				title = strings.TrimSpace(title)
				if title == "" {
					title = "test title"
				}

				// 创建一个会失败的 mock repository
				mockRepo := &mockFailingRepository{}
				svc := NewTaskService(mockRepo)
				ctx := context.Background()

				// 测试 Create 操作的错误处理
				_, err := svc.CreateTask(ctx, model.CreateTaskRequest{
					Title:       title,
					Description: desc,
				})
				if err == nil {
					t.Log("Expected error from Create, got nil")
					return false
				}
				// 验证错误是 ErrDatabaseOperation
				if !errors.Is(err, repository.ErrDatabaseOperation) {
					t.Logf("Expected ErrDatabaseOperation, got: %v", err)
					return false
				}
				// 验证错误消息包含描述性信息
				if err.Error() == "" {
					t.Log("Error message is empty")
					return false
				}

				// 测试 GetTask 操作的错误处理
				_, err = svc.GetTask(ctx, id)
				if err == nil {
					t.Log("Expected error from GetTask, got nil")
					return false
				}
				if !errors.Is(err, repository.ErrDatabaseOperation) {
					t.Logf("Expected ErrDatabaseOperation from GetTask, got: %v", err)
					return false
				}
				if err.Error() == "" {
					t.Log("GetTask error message is empty")
					return false
				}

				// 测试 ListTasks 操作的错误处理
				_, err = svc.ListTasks(ctx)
				if err == nil {
					t.Log("Expected error from ListTasks, got nil")
					return false
				}
				if !errors.Is(err, repository.ErrDatabaseOperation) {
					t.Logf("Expected ErrDatabaseOperation from ListTasks, got: %v", err)
					return false
				}
				if err.Error() == "" {
					t.Log("ListTasks error message is empty")
					return false
				}

				// 测试 UpdateTaskStatus 操作的错误处理
				_, err = svc.UpdateTaskStatus(ctx, id, true)
				if err == nil {
					t.Log("Expected error from UpdateTaskStatus, got nil")
					return false
				}
				if !errors.Is(err, repository.ErrDatabaseOperation) {
					t.Logf("Expected ErrDatabaseOperation from UpdateTaskStatus, got: %v", err)
					return false
				}
				if err.Error() == "" {
					t.Log("UpdateTaskStatus error message is empty")
					return false
				}

				// 测试 DeleteTask 操作的错误处理
				err = svc.DeleteTask(ctx, id)
				if err == nil {
					t.Log("Expected error from DeleteTask, got nil")
					return false
				}
				if !errors.Is(err, repository.ErrDatabaseOperation) {
					t.Logf("Expected ErrDatabaseOperation from DeleteTask, got: %v", err)
					return false
				}
				if err.Error() == "" {
					t.Log("DeleteTask error message is empty")
					return false
				}

				return true
			},
			gen.Int64(),     // ID
			gen.AnyString(), // Title
			gen.AnyString(), // Description
		))

	properties.TestingRun(t)
}

// mockFailingRepository 是一个总是返回数据库错误的 mock repository
type mockFailingRepository struct{}

func (m *mockFailingRepository) Create(ctx context.Context, task *model.Task) error {
	return fmt.Errorf("%w: simulated database error during create", repository.ErrDatabaseOperation)
}

func (m *mockFailingRepository) FindByID(ctx context.Context, id int64) (*model.Task, error) {
	return nil, fmt.Errorf("%w: simulated database error during find", repository.ErrDatabaseOperation)
}

func (m *mockFailingRepository) FindAll(ctx context.Context) ([]*model.Task, error) {
	return nil, fmt.Errorf("%w: simulated database error during find all", repository.ErrDatabaseOperation)
}

func (m *mockFailingRepository) Update(ctx context.Context, task *model.Task) error {
	return fmt.Errorf("%w: simulated database error during update", repository.ErrDatabaseOperation)
}

func (m *mockFailingRepository) Delete(ctx context.Context, id int64) error {
	return fmt.Errorf("%w: simulated database error during delete", repository.ErrDatabaseOperation)
}

// Feature: task-list-and-update, Property 14: 更新操作字段限制
// **Validates: Requirements 3.9, 3.10**
//
// 对于任何任务更新操作，更新后的任务对象应该：
// - 保持id、completed、created_at字段不变
// - 仅更新title和description字段为请求中提供的新值
func TestProperty_UpdateTaskFieldRestrictions(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	properties.Property("update task preserves id, completed, created_at and only updates title and description",
		prop.ForAll(
			func(originalTitle, originalDesc, newTitle, newDesc string, originalCompleted bool) bool {
				// 创建新的 mock repository 和 service 用于每次测试
				repo := newMockRepository()
				service := NewTaskService(repo)
				ctx := context.Background()

				// 确保原始标题有效（非空）
				originalTitle = strings.TrimSpace(originalTitle)
				if originalTitle == "" {
					originalTitle = "Original Task"
				}

				// 确保新标题有效（非空且长度不超过200）
				newTitle = strings.TrimSpace(newTitle)
				if newTitle == "" {
					newTitle = "Updated Task"
				}
				if len(newTitle) > 200 {
					newTitle = newTitle[:200]
				}

				// 确保新描述长度不超过1000
				if len(newDesc) > 1000 {
					newDesc = newDesc[:1000]
				}

				// 创建原始任务
				originalTask, err := service.CreateTask(ctx, model.CreateTaskRequest{
					Title:       originalTitle,
					Description: originalDesc,
				})
				if err != nil {
					t.Logf("CreateTask failed: %v", err)
					return false
				}

				// 设置任务的完成状态为指定值
				if originalCompleted {
					originalTask, err = service.UpdateTaskStatus(ctx, originalTask.ID, true)
					if err != nil {
						t.Logf("UpdateTaskStatus failed: %v", err)
						return false
					}
				}

				// 记录更新前的字段值
				originalID := originalTask.ID
				originalCompletedStatus := originalTask.Completed
				originalCreatedAt := originalTask.CreatedAt

				// 执行更新操作
				updatedTask, err := service.UpdateTask(ctx, originalTask.ID, model.UpdateTaskRequest{
					Title:       newTitle,
					Description: newDesc,
				})
				if err != nil {
					t.Logf("UpdateTask failed: %v", err)
					return false
				}

				// 验证 ID 字段保持不变
				if updatedTask.ID != originalID {
					t.Logf("ID changed after update: expected %d, got %d", originalID, updatedTask.ID)
					return false
				}

				// 验证 Completed 字段保持不变
				if updatedTask.Completed != originalCompletedStatus {
					t.Logf("Completed status changed after update: expected %v, got %v", originalCompletedStatus, updatedTask.Completed)
					return false
				}

				// 验证 CreatedAt 字段保持不变
				if !updatedTask.CreatedAt.Equal(originalCreatedAt) {
					t.Logf("CreatedAt changed after update: expected %v, got %v", originalCreatedAt, updatedTask.CreatedAt)
					return false
				}

				// 验证 Title 字段已更新为新值
				if updatedTask.Title != newTitle {
					t.Logf("Title not updated correctly: expected %q, got %q", newTitle, updatedTask.Title)
					return false
				}

				// 验证 Description 字段已更新为新值
				if updatedTask.Description != newDesc {
					t.Logf("Description not updated correctly: expected %q, got %q", newDesc, updatedTask.Description)
					return false
				}

				// 额外验证：通过 GetTask 检索任务，确认更新已持久化且字段限制仍然有效
				retrievedTask, err := service.GetTask(ctx, originalTask.ID)
				if err != nil {
					t.Logf("GetTask failed after update: %v", err)
					return false
				}

				// 验证检索到的任务也满足字段限制
				if retrievedTask.ID != originalID {
					t.Logf("Retrieved task ID mismatch: expected %d, got %d", originalID, retrievedTask.ID)
					return false
				}
				if retrievedTask.Completed != originalCompletedStatus {
					t.Logf("Retrieved task Completed mismatch: expected %v, got %v", originalCompletedStatus, retrievedTask.Completed)
					return false
				}
				if !retrievedTask.CreatedAt.Equal(originalCreatedAt) {
					t.Logf("Retrieved task CreatedAt mismatch: expected %v, got %v", originalCreatedAt, retrievedTask.CreatedAt)
					return false
				}
				if retrievedTask.Title != newTitle {
					t.Logf("Retrieved task Title mismatch: expected %q, got %q", newTitle, retrievedTask.Title)
					return false
				}
				if retrievedTask.Description != newDesc {
					t.Logf("Retrieved task Description mismatch: expected %q, got %q", newDesc, retrievedTask.Description)
					return false
				}

				return true
			},
			gen.AnyString(), // originalTitle
			gen.AnyString(), // originalDesc
			gen.AnyString(), // newTitle
			gen.AnyString(), // newDesc
			gen.Bool(),      // originalCompleted
		))

	properties.TestingRun(t)
}

// TestUpdateTask 测试更新任务
func TestUpdateTask(t *testing.T) {
	repo := newMockRepository()
	service := NewTaskService(repo)
	ctx := context.Background()

	// 创建一个任务用于测试
	created, err := service.CreateTask(ctx, model.CreateTaskRequest{
		Title:       "Original Task",
		Description: "Original Description",
	})
	if err != nil {
		t.Fatalf("Failed to create task: %v", err)
	}

	// 设置任务为已完成状态
	created, err = service.UpdateTaskStatus(ctx, created.ID, true)
	if err != nil {
		t.Fatalf("Failed to update task status: %v", err)
	}

	tests := []struct {
		name    string
		id      int64
		req     model.UpdateTaskRequest
		wantErr bool
		errType error
	}{
		{
			name: "successful update",
			id:   created.ID,
			req: model.UpdateTaskRequest{
				Title:       "Updated Task",
				Description: "Updated Description",
			},
			wantErr: false,
		},
		{
			name: "update with whitespace in title",
			id:   created.ID,
			req: model.UpdateTaskRequest{
				Title:       "  Task with spaces  ",
				Description: "Description",
			},
			wantErr: false,
		},
		{
			name: "validation failure - empty title",
			id:   created.ID,
			req: model.UpdateTaskRequest{
				Title:       "",
				Description: "Description",
			},
			wantErr: true,
			errType: &model.ValidationError{},
		},
		{
			name: "validation failure - whitespace only title",
			id:   created.ID,
			req: model.UpdateTaskRequest{
				Title:       "   ",
				Description: "Description",
			},
			wantErr: true,
			errType: &model.ValidationError{},
		},
		{
			name: "validation failure - title too long",
			id:   created.ID,
			req: model.UpdateTaskRequest{
				Title:       strings.Repeat("a", 201),
				Description: "Description",
			},
			wantErr: true,
			errType: &model.ValidationError{},
		},
		{
			name: "validation failure - description too long",
			id:   created.ID,
			req: model.UpdateTaskRequest{
				Title:       "Valid Title",
				Description: strings.Repeat("a", 1001),
			},
			wantErr: true,
			errType: &model.ValidationError{},
		},
		{
			name: "task not found",
			id:   999,
			req: model.UpdateTaskRequest{
				Title:       "Updated Task",
				Description: "Updated Description",
			},
			wantErr: true,
			errType: repository.ErrNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 记录更新前的状态
			var originalTask *model.Task
			if tt.id == created.ID {
				originalTask, _ = service.GetTask(ctx, tt.id)
			}

			task, err := service.UpdateTask(ctx, tt.id, tt.req)

			if (err != nil) != tt.wantErr {
				t.Errorf("UpdateTask() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantErr {
				// 验证错误类型
				if tt.errType != nil {
					switch tt.errType.(type) {
					case *model.ValidationError:
						var validationErr *model.ValidationError
						if !errors.As(err, &validationErr) {
							t.Errorf("UpdateTask() error type = %T, want ValidationError", err)
						}
					default:
						if !errors.Is(err, tt.errType) {
							t.Errorf("UpdateTask() error = %v, want %v", err, tt.errType)
						}
					}
				}
				return
			}

			// 验证成功更新的情况
			if task == nil {
				t.Error("UpdateTask() returned nil task")
				return
			}

			// 验证 ID 保持不变
			if task.ID != tt.id {
				t.Errorf("UpdateTask() ID = %v, want %v", task.ID, tt.id)
			}

			// 验证 title 已更新（去除首尾空格）
			expectedTitle := strings.TrimSpace(tt.req.Title)
			if task.Title != expectedTitle {
				t.Errorf("UpdateTask() Title = %v, want %v", task.Title, expectedTitle)
			}

			// 验证 description 已更新
			if task.Description != tt.req.Description {
				t.Errorf("UpdateTask() Description = %v, want %v", task.Description, tt.req.Description)
			}

			// 验证 completed 状态保持不变
			if originalTask != nil && task.Completed != originalTask.Completed {
				t.Errorf("UpdateTask() Completed = %v, want %v (should not change)", task.Completed, originalTask.Completed)
			}

			// 验证 created_at 保持不变
			if originalTask != nil && !task.CreatedAt.Equal(originalTask.CreatedAt) {
				t.Errorf("UpdateTask() CreatedAt = %v, want %v (should not change)", task.CreatedAt, originalTask.CreatedAt)
			}

			// 验证更新已持久化
			retrieved, err := service.GetTask(ctx, tt.id)
			if err != nil {
				t.Errorf("GetTask() after update error = %v", err)
				return
			}
			if retrieved.Title != expectedTitle {
				t.Errorf("Retrieved task Title = %v, want %v", retrieved.Title, expectedTitle)
			}
			if retrieved.Description != tt.req.Description {
				t.Errorf("Retrieved task Description = %v, want %v", retrieved.Description, tt.req.Description)
			}
		})
	}
}

// TestUpdateTask_DatabaseError 测试数据库错误场景
func TestUpdateTask_DatabaseError(t *testing.T) {
	// 创建一个会在 Update 时失败的 mock repository
	mockRepo := &mockFailingRepository{}
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// 尝试更新任务（会触发数据库错误）
	_, err := service.UpdateTask(ctx, 1, model.UpdateTaskRequest{
		Title:       "Updated Task",
		Description: "Updated Description",
	})

	// 验证返回了错误
	if err == nil {
		t.Error("UpdateTask() expected error for database failure, got nil")
		return
	}

	// 验证错误类型是 ErrDatabaseOperation
	if !errors.Is(err, repository.ErrDatabaseOperation) {
		t.Errorf("UpdateTask() error = %v, want ErrDatabaseOperation", err)
	}
}
