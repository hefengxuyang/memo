package model

import (
	"strings"
	"time"
)

// Task 表示一个待办任务实体
type Task struct {
	ID          int64     `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	Completed   bool      `json:"completed" db:"completed"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// CreateTaskRequest 创建任务请求
type CreateTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// UpdateTaskStatusRequest 更新任务状态请求
type UpdateTaskStatusRequest struct {
	Completed bool `json:"completed"`
}

// UpdateTaskRequest 更新任务请求
type UpdateTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
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

// ValidateTitle 验证任务标题非空
// 返回 true 如果标题有效（去除首尾空格后非空）
func ValidateTitle(title string) bool {
	return strings.TrimSpace(title) != ""
}

// Validate 验证 CreateTaskRequest
// 返回 error 如果验证失败
func (r *CreateTaskRequest) Validate() error {
	if !ValidateTitle(r.Title) {
		return &ValidationError{Field: "title", Message: "title cannot be empty"}
	}
	return nil
}

// Validate 验证 UpdateTaskRequest
// 返回 error 如果验证失败
func (r *UpdateTaskRequest) Validate() error {
	// 验证 title 非空且长度在 1-200 字符
	trimmedTitle := strings.TrimSpace(r.Title)
	if trimmedTitle == "" {
		return &ValidationError{Field: "title", Message: "title cannot be empty"}
	}
	if len(trimmedTitle) > 200 {
		return &ValidationError{Field: "title", Message: "title length must not exceed 200 characters"}
	}

	// 验证 description 长度不超过 1000 字符
	if len(r.Description) > 1000 {
		return &ValidationError{Field: "description", Message: "description length must not exceed 1000 characters"}
	}

	return nil
}

// ValidationError 表示验证错误
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
