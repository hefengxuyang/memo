package service

import (
	"context"
	"errors"
	"strings"

	"memo/internal/model"
	"memo/internal/repository"
)

// TaskService 定义任务业务逻辑接口
type TaskService interface {
	// CreateTask 创建新任务
	CreateTask(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error)

	// GetTask 根据 ID 获取任务
	GetTask(ctx context.Context, id int64) (*model.Task, error)

	// ListTasks 获取所有任务列表
	ListTasks(ctx context.Context) ([]*model.Task, error)

	// UpdateTaskStatus 更新任务完成状态
	UpdateTaskStatus(ctx context.Context, id int64, completed bool) (*model.Task, error)

	// UpdateTask 更新任务标题和描述
	UpdateTask(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error)

	// DeleteTask 删除任务
	DeleteTask(ctx context.Context, id int64) error
}

// taskService 实现 TaskService 接口
type taskService struct {
	repo repository.TaskRepository
}

// NewTaskService 创建新的 TaskService 实例
func NewTaskService(repo repository.TaskRepository) TaskService {
	return &taskService{repo: repo}
}

// ErrInvalidInput 表示输入验证失败
var ErrInvalidInput = errors.New("invalid input")

// CreateTask 创建新任务
// 验证输入（标题非空），调用 repository 创建任务
func (s *taskService) CreateTask(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
	// 验证输入
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// 去除标题首尾空格
	title := strings.TrimSpace(req.Title)

	// 创建任务对象
	task := &model.Task{
		Title:       title,
		Description: req.Description,
		Completed:   false,
	}

	// 调用 repository 创建任务
	if err := s.repo.Create(ctx, task); err != nil {
		return nil, err
	}

	return task, nil
}

// GetTask 根据 ID 获取任务
// 处理任务不存在的情况
func (s *taskService) GetTask(ctx context.Context, id int64) (*model.Task, error) {
	task, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return task, nil
}

// ListTasks 获取所有任务列表
func (s *taskService) ListTasks(ctx context.Context) ([]*model.Task, error) {
	tasks, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

// UpdateTaskStatus 更新任务完成状态
// 先获取任务，更新状态，然后保存
func (s *taskService) UpdateTaskStatus(ctx context.Context, id int64, completed bool) (*model.Task, error) {
	// 获取现有任务
	task, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 更新完成状态
	task.Completed = completed

	// 保存更新
	if err := s.repo.Update(ctx, task); err != nil {
		return nil, err
	}

	return task, nil
}

// UpdateTask 更新任务标题和描述
// 验证请求数据，调用 repository.Update 更新任务
// 处理任务不存在的情况，返回适当错误
// 确保仅更新 title 和 description 字段
func (s *taskService) UpdateTask(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
	// 验证输入
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// 获取现有任务
	task, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 仅更新 title 和 description 字段
	// 保持 id、completed 和 created_at 字段不变
	task.Title = strings.TrimSpace(req.Title)
	task.Description = req.Description

	// 保存更新
	if err := s.repo.Update(ctx, task); err != nil {
		return nil, err
	}

	return task, nil
}

// DeleteTask 删除任务
// 处理任务不存在的情况
func (s *taskService) DeleteTask(ctx context.Context, id int64) error {
	// 调用 repository 删除任务
	// repository 会处理任务不存在的情况并返回 ErrNotFound
	return s.repo.Delete(ctx, id)
}
