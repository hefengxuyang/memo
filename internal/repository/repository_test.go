package repository

import (
	"context"
	"testing"
	"time"

	"memo/internal/model"
)

// setupTestDB 创建测试用的内存数据库
func setupTestDB(t *testing.T) *sqliteRepository {
	db, err := InitDB(":memory:")
	if err != nil {
		t.Fatalf("failed to initialize test database: %v", err)
	}

	t.Cleanup(func() {
		db.Close()
	})

	return &sqliteRepository{db: db}
}

func TestCreate(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	task := &model.Task{
		Title:       "Test Task",
		Description: "Test Description",
		Completed:   false,
	}

	err := repo.Create(ctx, task)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// 验证 ID 已生成
	if task.ID == 0 {
		t.Error("Expected task ID to be set, got 0")
	}

	// 验证 CreatedAt 已设置
	if task.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
}

func TestFindByID(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 创建任务
	task := &model.Task{
		Title:       "Test Task",
		Description: "Test Description",
		Completed:   false,
	}
	err := repo.Create(ctx, task)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// 查询任务
	found, err := repo.FindByID(ctx, task.ID)
	if err != nil {
		t.Fatalf("FindByID failed: %v", err)
	}

	// 验证数据
	if found.ID != task.ID {
		t.Errorf("Expected ID %d, got %d", task.ID, found.ID)
	}
	if found.Title != task.Title {
		t.Errorf("Expected Title %s, got %s", task.Title, found.Title)
	}
	if found.Description != task.Description {
		t.Errorf("Expected Description %s, got %s", task.Description, found.Description)
	}
	if found.Completed != task.Completed {
		t.Errorf("Expected Completed %v, got %v", task.Completed, found.Completed)
	}
}

func TestFindByID_NotFound(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 查询不存在的任务
	_, err := repo.FindByID(ctx, 999)
	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound, got %v", err)
	}
}

func TestFindAll(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 创建多个任务
	tasks := []*model.Task{
		{Title: "Task 1", Description: "Desc 1", Completed: false},
		{Title: "Task 2", Description: "Desc 2", Completed: true},
		{Title: "Task 3", Description: "Desc 3", Completed: false},
	}

	for _, task := range tasks {
		err := repo.Create(ctx, task)
		if err != nil {
			t.Fatalf("Create failed: %v", err)
		}
		// 添加小延迟确保 created_at 不同
		time.Sleep(time.Millisecond)
	}

	// 查询所有任务
	found, err := repo.FindAll(ctx)
	if err != nil {
		t.Fatalf("FindAll failed: %v", err)
	}

	// 验证数量
	if len(found) != len(tasks) {
		t.Errorf("Expected %d tasks, got %d", len(tasks), len(found))
	}

	// 验证按创建时间降序排列（最新的在前）
	if len(found) >= 2 {
		if found[0].CreatedAt.Before(found[1].CreatedAt) {
			t.Error("Expected tasks to be ordered by created_at DESC")
		}
	}
}

func TestFindAll_Empty(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 查询空数据库
	found, err := repo.FindAll(ctx)
	if err != nil {
		t.Fatalf("FindAll failed: %v", err)
	}

	// 验证返回空列表
	if len(found) != 0 {
		t.Errorf("Expected empty list, got %d tasks", len(found))
	}
}

func TestUpdate(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 创建任务
	task := &model.Task{
		Title:       "Original Title",
		Description: "Original Description",
		Completed:   false,
	}
	err := repo.Create(ctx, task)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// 更新任务
	task.Title = "Updated Title"
	task.Description = "Updated Description"
	task.Completed = true

	err = repo.Update(ctx, task)
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}

	// 验证更新
	found, err := repo.FindByID(ctx, task.ID)
	if err != nil {
		t.Fatalf("FindByID failed: %v", err)
	}

	if found.Title != "Updated Title" {
		t.Errorf("Expected Title 'Updated Title', got %s", found.Title)
	}
	if found.Description != "Updated Description" {
		t.Errorf("Expected Description 'Updated Description', got %s", found.Description)
	}
	if !found.Completed {
		t.Error("Expected Completed to be true")
	}
}

func TestUpdate_NotFound(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 更新不存在的任务
	task := &model.Task{
		ID:          999,
		Title:       "Test",
		Description: "Test",
		Completed:   false,
	}

	err := repo.Update(ctx, task)
	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound, got %v", err)
	}
}

func TestDelete(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 创建任务
	task := &model.Task{
		Title:       "Test Task",
		Description: "Test Description",
		Completed:   false,
	}
	err := repo.Create(ctx, task)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// 删除任务
	err = repo.Delete(ctx, task.ID)
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	// 验证任务已删除
	_, err = repo.FindByID(ctx, task.ID)
	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound after delete, got %v", err)
	}
}

func TestDelete_NotFound(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 删除不存在的任务
	err := repo.Delete(ctx, 999)
	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound, got %v", err)
	}
}

func TestTaskIDUniqueness(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	// 创建多个任务
	ids := make(map[int64]bool)
	for i := 0; i < 10; i++ {
		task := &model.Task{
			Title:       "Test Task",
			Description: "Test Description",
			Completed:   false,
		}
		err := repo.Create(ctx, task)
		if err != nil {
			t.Fatalf("Create failed: %v", err)
		}

		// 检查 ID 唯一性
		if ids[task.ID] {
			t.Errorf("Duplicate task ID: %d", task.ID)
		}
		ids[task.ID] = true
	}
}
