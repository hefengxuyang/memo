package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"memo/internal/model"
	"memo/internal/repository"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// mockTaskService 是 TaskService 的 mock 实现
type mockTaskService struct {
	createTaskFunc       func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error)
	getTaskFunc          func(ctx context.Context, id int64) (*model.Task, error)
	listTasksFunc        func(ctx context.Context) ([]*model.Task, error)
	updateTaskStatusFunc func(ctx context.Context, id int64, completed bool) (*model.Task, error)
	updateTaskFunc       func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error)
	deleteTaskFunc       func(ctx context.Context, id int64) error
}

func (m *mockTaskService) CreateTask(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
	if m.createTaskFunc != nil {
		return m.createTaskFunc(ctx, req)
	}
	return nil, errors.New("not implemented")
}

func (m *mockTaskService) GetTask(ctx context.Context, id int64) (*model.Task, error) {
	if m.getTaskFunc != nil {
		return m.getTaskFunc(ctx, id)
	}
	return nil, errors.New("not implemented")
}

func (m *mockTaskService) ListTasks(ctx context.Context) ([]*model.Task, error) {
	if m.listTasksFunc != nil {
		return m.listTasksFunc(ctx)
	}
	return nil, errors.New("not implemented")
}

func (m *mockTaskService) UpdateTaskStatus(ctx context.Context, id int64, completed bool) (*model.Task, error) {
	if m.updateTaskStatusFunc != nil {
		return m.updateTaskStatusFunc(ctx, id, completed)
	}
	return nil, errors.New("not implemented")
}

func (m *mockTaskService) UpdateTask(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
	if m.updateTaskFunc != nil {
		return m.updateTaskFunc(ctx, id, req)
	}
	return nil, errors.New("not implemented")
}

func (m *mockTaskService) DeleteTask(ctx context.Context, id int64) error {
	if m.deleteTaskFunc != nil {
		return m.deleteTaskFunc(ctx, id)
	}
	return errors.New("not implemented")
}

// TestCreateTask_Success 测试成功创建任务
func TestCreateTask_Success(t *testing.T) {
	mockService := &mockTaskService{
		createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
			return &model.Task{
				ID:          1,
				Title:       req.Title,
				Description: req.Description,
				Completed:   false,
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Test Task","description":"Test Description"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	handler.CreateTask(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var resp model.TaskResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data.Title != "Test Task" {
		t.Errorf("expected title 'Test Task', got '%s'", resp.Data.Title)
	}
}

// TestCreateTask_InvalidJSON 测试无效 JSON 格式
func TestCreateTask_InvalidJSON(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Test Task",` // 无效 JSON
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	handler.CreateTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "invalid_json" {
		t.Errorf("expected error 'invalid_json', got '%s'", resp.Error)
	}
}

// TestCreateTask_EmptyTitle 测试空标题验证
func TestCreateTask_EmptyTitle(t *testing.T) {
	mockService := &mockTaskService{
		createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
			return nil, &model.ValidationError{Field: "title", Message: "title cannot be empty"}
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"","description":"Test Description"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	handler.CreateTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "validation_error" {
		t.Errorf("expected error 'validation_error', got '%s'", resp.Error)
	}
}

// TestGetTask_Success 测试成功获取任务
func TestGetTask_Success(t *testing.T) {
	mockService := &mockTaskService{
		getTaskFunc: func(ctx context.Context, id int64) (*model.Task, error) {
			return &model.Task{
				ID:          id,
				Title:       "Test Task",
				Description: "Test Description",
				Completed:   false,
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/1", nil)
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp model.TaskResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data.ID != 1 {
		t.Errorf("expected ID 1, got %d", resp.Data.ID)
	}
}

// TestGetTask_NotFound 测试任务不存在
func TestGetTask_NotFound(t *testing.T) {
	mockService := &mockTaskService{
		getTaskFunc: func(ctx context.Context, id int64) (*model.Task, error) {
			return nil, repository.ErrNotFound
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/999", nil)
	req.SetPathValue("id", "999")
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "not_found" {
		t.Errorf("expected error 'not_found', got '%s'", resp.Error)
	}
}

// TestGetTask_InvalidID 测试无效 ID
func TestGetTask_InvalidID(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/invalid", nil)
	req.SetPathValue("id", "invalid")
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestListTasks_Success 测试成功获取任务列表
func TestListTasks_Success(t *testing.T) {
	mockService := &mockTaskService{
		listTasksFunc: func(ctx context.Context) ([]*model.Task, error) {
			return []*model.Task{
				{ID: 1, Title: "Task 1", Description: "Desc 1", Completed: false, CreatedAt: time.Now()},
				{ID: 2, Title: "Task 2", Description: "Desc 2", Completed: true, CreatedAt: time.Now()},
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	w := httptest.NewRecorder()

	handler.ListTasks(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp model.TaskListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(resp.Data) != 2 {
		t.Errorf("expected 2 tasks, got %d", len(resp.Data))
	}
}

// TestListTasks_Empty 测试空任务列表
func TestListTasks_Empty(t *testing.T) {
	mockService := &mockTaskService{
		listTasksFunc: func(ctx context.Context) ([]*model.Task, error) {
			return []*model.Task{}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	w := httptest.NewRecorder()

	handler.ListTasks(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp model.TaskListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(resp.Data) != 0 {
		t.Errorf("expected 0 tasks, got %d", len(resp.Data))
	}
}

// TestUpdateTaskStatus_Success 测试成功更新任务状态
func TestUpdateTaskStatus_Success(t *testing.T) {
	mockService := &mockTaskService{
		updateTaskStatusFunc: func(ctx context.Context, id int64, completed bool) (*model.Task, error) {
			return &model.Task{
				ID:          id,
				Title:       "Test Task",
				Description: "Test Description",
				Completed:   completed,
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"completed":true}`
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/1/status", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.UpdateTaskStatus(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp model.TaskResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !resp.Data.Completed {
		t.Error("expected task to be completed")
	}
}

// TestUpdateTaskStatus_NotFound 测试更新不存在的任务
func TestUpdateTaskStatus_NotFound(t *testing.T) {
	mockService := &mockTaskService{
		updateTaskStatusFunc: func(ctx context.Context, id int64, completed bool) (*model.Task, error) {
			return nil, repository.ErrNotFound
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"completed":true}`
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/999/status", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "999")
	w := httptest.NewRecorder()

	handler.UpdateTaskStatus(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestDeleteTask_Success 测试成功删除任务
func TestDeleteTask_Success(t *testing.T) {
	mockService := &mockTaskService{
		deleteTaskFunc: func(ctx context.Context, id int64) error {
			return nil
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/1", nil)
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.DeleteTask(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected status %d, got %d", http.StatusNoContent, w.Code)
	}
}

// TestDeleteTask_NotFound 测试删除不存在的任务
func TestDeleteTask_NotFound(t *testing.T) {
	mockService := &mockTaskService{
		deleteTaskFunc: func(ctx context.Context, id int64) error {
			return repository.ErrNotFound
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/999", nil)
	req.SetPathValue("id", "999")
	w := httptest.NewRecorder()

	handler.DeleteTask(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestHandleServiceError_InternalError 测试内部服务器错误
func TestHandleServiceError_InternalError(t *testing.T) {
	mockService := &mockTaskService{
		getTaskFunc: func(ctx context.Context, id int64) (*model.Task, error) {
			return nil, errors.New("database connection failed")
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/1", nil)
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "internal_error" {
		t.Errorf("expected error 'internal_error', got '%s'", resp.Error)
	}
}

// TestHandleServiceError_DatabaseConnection 测试数据库连接错误 (503)
func TestHandleServiceError_DatabaseConnection(t *testing.T) {
	mockService := &mockTaskService{
		listTasksFunc: func(ctx context.Context) ([]*model.Task, error) {
			return nil, repository.ErrDatabaseConnection
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	w := httptest.NewRecorder()

	handler.ListTasks(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "service_unavailable" {
		t.Errorf("expected error 'service_unavailable', got '%s'", resp.Error)
	}

	if resp.Message != "service temporarily unavailable" {
		t.Errorf("expected message 'service temporarily unavailable', got '%s'", resp.Message)
	}
}

// TestHandleServiceError_DatabaseOperation 测试数据库操作错误 (500)
func TestHandleServiceError_DatabaseOperation(t *testing.T) {
	mockService := &mockTaskService{
		createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
			return nil, repository.ErrDatabaseOperation
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Test Task","description":"Test Description"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	handler.CreateTask(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "internal_error" {
		t.Errorf("expected error 'internal_error', got '%s'", resp.Error)
	}

	if resp.Message != "internal server error" {
		t.Errorf("expected message 'internal server error', got '%s'", resp.Message)
	}
}

// TestErrorHandling_AllStatusCodes 测试所有 HTTP 状态码映射
func TestErrorHandling_AllStatusCodes(t *testing.T) {
	tests := []struct {
		name           string
		setupMock      func() *mockTaskService
		expectedStatus int
		expectedError  string
		expectedMsg    string
	}{
		{
			name: "400 - Validation Error",
			setupMock: func() *mockTaskService {
				return &mockTaskService{
					createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
						return nil, &model.ValidationError{Field: "title", Message: "title cannot be empty"}
					},
				}
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "validation_error",
			expectedMsg:    "title cannot be empty",
		},
		{
			name: "400 - Invalid JSON",
			setupMock: func() *mockTaskService {
				return &mockTaskService{}
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid_json",
			expectedMsg:    "invalid JSON format",
		},
		{
			name: "404 - Not Found",
			setupMock: func() *mockTaskService {
				return &mockTaskService{
					getTaskFunc: func(ctx context.Context, id int64) (*model.Task, error) {
						return nil, repository.ErrNotFound
					},
				}
			},
			expectedStatus: http.StatusNotFound,
			expectedError:  "not_found",
			expectedMsg:    "task not found",
		},
		{
			name: "500 - Database Operation Error",
			setupMock: func() *mockTaskService {
				return &mockTaskService{
					listTasksFunc: func(ctx context.Context) ([]*model.Task, error) {
						return nil, repository.ErrDatabaseOperation
					},
				}
			},
			expectedStatus: http.StatusInternalServerError,
			expectedError:  "internal_error",
			expectedMsg:    "internal server error",
		},
		{
			name: "503 - Database Connection Error",
			setupMock: func() *mockTaskService {
				return &mockTaskService{
					listTasksFunc: func(ctx context.Context) ([]*model.Task, error) {
						return nil, repository.ErrDatabaseConnection
					},
				}
			},
			expectedStatus: http.StatusServiceUnavailable,
			expectedError:  "service_unavailable",
			expectedMsg:    "service temporarily unavailable",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.setupMock()
			handler := NewTaskHandler(mockService)

			var req *http.Request
			var w *httptest.ResponseRecorder

			// 根据测试类型设置不同的请求
			switch tt.name {
			case "400 - Invalid JSON":
				reqBody := `{"title":"Test",` // 无效 JSON
				req = httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
				w = httptest.NewRecorder()
				handler.CreateTask(w, req)
			case "400 - Validation Error":
				reqBody := `{"title":"","description":"Test"}`
				req = httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
				w = httptest.NewRecorder()
				handler.CreateTask(w, req)
			case "404 - Not Found":
				req = httptest.NewRequest(http.MethodGet, "/api/tasks/999", nil)
				req.SetPathValue("id", "999")
				w = httptest.NewRecorder()
				handler.GetTask(w, req)
			default:
				req = httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
				w = httptest.NewRecorder()
				handler.ListTasks(w, req)
			}

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			var resp model.ErrorResponse
			if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Error != tt.expectedError {
				t.Errorf("expected error '%s', got '%s'", tt.expectedError, resp.Error)
			}

			if resp.Message != tt.expectedMsg {
				t.Errorf("expected message '%s', got '%s'", tt.expectedMsg, resp.Message)
			}
		})
	}
}

// TestUpdateTaskStatus_InvalidJSON 测试更新状态时的无效 JSON
func TestUpdateTaskStatus_InvalidJSON(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	reqBody := `{"completed":` // 无效 JSON
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/1/status", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.UpdateTaskStatus(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "invalid_json" {
		t.Errorf("expected error 'invalid_json', got '%s'", resp.Error)
	}
}

// TestUpdateTaskStatus_InvalidID 测试更新状态时的无效 ID
func TestUpdateTaskStatus_InvalidID(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	reqBody := `{"completed":true}`
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/invalid/status", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "invalid")
	w := httptest.NewRecorder()

	handler.UpdateTaskStatus(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestDeleteTask_InvalidID 测试删除时的无效 ID
func TestDeleteTask_InvalidID(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/invalid", nil)
	req.SetPathValue("id", "invalid")
	w := httptest.NewRecorder()

	handler.DeleteTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestGetTask_MissingID 测试缺少 ID 参数
func TestGetTask_MissingID(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/", nil)
	// 不设置 PathValue，模拟缺少 ID
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestGetTask_NegativeID 测试负数 ID
func TestGetTask_NegativeID(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/-1", nil)
	req.SetPathValue("id", "-1")
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestGetTask_ZeroID 测试零 ID
func TestGetTask_ZeroID(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/0", nil)
	req.SetPathValue("id", "0")
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestJSONSerialization_CompleteTask 测试完整任务的 JSON 序列化
func TestJSONSerialization_CompleteTask(t *testing.T) {
	now := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	mockService := &mockTaskService{
		getTaskFunc: func(ctx context.Context, id int64) (*model.Task, error) {
			return &model.Task{
				ID:          123,
				Title:       "Test Task with Special Chars: <>&\"'",
				Description: "Description with\nnewlines\tand\ttabs",
				Completed:   true,
				CreatedAt:   now,
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/123", nil)
	req.SetPathValue("id", "123")
	w := httptest.NewRecorder()

	handler.GetTask(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	// 验证 Content-Type
	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
	}

	// 解析响应并验证所有字段
	var resp model.TaskResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data.ID != 123 {
		t.Errorf("expected ID 123, got %d", resp.Data.ID)
	}
	if resp.Data.Title != "Test Task with Special Chars: <>&\"'" {
		t.Errorf("expected title with special chars, got '%s'", resp.Data.Title)
	}
	if resp.Data.Description != "Description with\nnewlines\tand\ttabs" {
		t.Errorf("expected description with special chars, got '%s'", resp.Data.Description)
	}
	if !resp.Data.Completed {
		t.Error("expected task to be completed")
	}
	if !resp.Data.CreatedAt.Equal(now) {
		t.Errorf("expected CreatedAt %v, got %v", now, resp.Data.CreatedAt)
	}
}

// TestJSONSerialization_EmptyDescription 测试空描述的序列化
func TestJSONSerialization_EmptyDescription(t *testing.T) {
	mockService := &mockTaskService{
		createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
			return &model.Task{
				ID:          1,
				Title:       req.Title,
				Description: req.Description,
				Completed:   false,
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Task without description","description":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	handler.CreateTask(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var resp model.TaskResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data.Description != "" {
		t.Errorf("expected empty description, got '%s'", resp.Data.Description)
	}
}

// TestJSONSerialization_UnicodeCharacters 测试 Unicode 字符的序列化
func TestJSONSerialization_UnicodeCharacters(t *testing.T) {
	mockService := &mockTaskService{
		createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
			return &model.Task{
				ID:          1,
				Title:       req.Title,
				Description: req.Description,
				Completed:   false,
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"任务标题 🎉","description":"描述内容 ✅ 中文测试"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	handler.CreateTask(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var resp model.TaskResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data.Title != "任务标题 🎉" {
		t.Errorf("expected Unicode title, got '%s'", resp.Data.Title)
	}
	if resp.Data.Description != "描述内容 ✅ 中文测试" {
		t.Errorf("expected Unicode description, got '%s'", resp.Data.Description)
	}
}

// TestListTasks_DatabaseError 测试列表查询时的数据库错误
func TestListTasks_DatabaseError(t *testing.T) {
	mockService := &mockTaskService{
		listTasksFunc: func(ctx context.Context) ([]*model.Task, error) {
			return nil, repository.ErrDatabaseOperation
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	w := httptest.NewRecorder()

	handler.ListTasks(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}
}

// TestCreateTask_DatabaseError 测试创建任务时的数据库错误
func TestCreateTask_DatabaseError(t *testing.T) {
	mockService := &mockTaskService{
		createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
			return nil, repository.ErrDatabaseOperation
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Test Task","description":"Test Description"}`
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(reqBody))
	w := httptest.NewRecorder()

	handler.CreateTask(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}
}

// TestUpdateTaskStatus_DatabaseError 测试更新状态时的数据库错误
func TestUpdateTaskStatus_DatabaseError(t *testing.T) {
	mockService := &mockTaskService{
		updateTaskStatusFunc: func(ctx context.Context, id int64, completed bool) (*model.Task, error) {
			return nil, repository.ErrDatabaseOperation
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"completed":true}`
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/1/status", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.UpdateTaskStatus(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}
}

// TestDeleteTask_DatabaseError 测试删除任务时的数据库错误
func TestDeleteTask_DatabaseError(t *testing.T) {
	mockService := &mockTaskService{
		deleteTaskFunc: func(ctx context.Context, id int64) error {
			return repository.ErrDatabaseOperation
		},
	}

	handler := NewTaskHandler(mockService)

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/1", nil)
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.DeleteTask(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, w.Code)
	}
}

// Feature: memo, Property 12: Invalid parameters return validation errors
// **Validates: Requirements 7.2, 7.4**
//
// For any API request with invalid parameters (wrong types, missing required fields,
// invalid values), the API should return a validation error response with appropriate
// HTTP status code (400).
func TestProperty_InvalidParametersReturnValidationErrors(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	// 生成各种无效输入的生成器
	genInvalidInput := gen.OneGenOf(
		// 1. 无效的 JSON 格式
		gen.Const(`{"title":"Test"`),                 // 缺少结束括号
		gen.Const(`{"title":"Test","description":}`), // 缺少值
		gen.Const(`{title:"Test"}`),                  // 缺少引号
		gen.Const(`{"title":"Test",}`),               // 多余的逗号
		gen.Const(`not json at all`),                 // 完全不是 JSON
		gen.Const(``),                                // 空字符串
		gen.Const(`{`),                               // 不完整的 JSON
		gen.Const(`{"title":}`),                      // 缺少值

		// 2. 空标题（有效 JSON 但验证失败）
		gen.Const(`{"title":"","description":"Test"}`),
		gen.Const(`{"title":"   ","description":"Test"}`),
		gen.Const(`{"title":"\t","description":"Test"}`),
		gen.Const(`{"title":"\n","description":"Test"}`),

		// 3. 缺少必需字段（虽然 description 是可选的，但 title 是必需的）
		gen.Const(`{"description":"Test"}`),
		gen.Const(`{}`),
	)

	properties.Property("invalid parameters return 400 status code with validation error",
		prop.ForAll(
			func(invalidInput string) bool {
				// 创建 mock service，对于空标题返回验证错误
				mockService := &mockTaskService{
					createTaskFunc: func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
						// 如果标题为空或只有空白字符，返回验证错误
						if strings.TrimSpace(req.Title) == "" {
							return nil, &model.ValidationError{Field: "title", Message: "title cannot be empty"}
						}
						// 否则返回成功（但这个测试不应该到达这里）
						return &model.Task{
							ID:          1,
							Title:       req.Title,
							Description: req.Description,
							Completed:   false,
							CreatedAt:   time.Now(),
						}, nil
					},
				}

				handler := NewTaskHandler(mockService)

				// 发送 POST 请求创建任务
				req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBufferString(invalidInput))
				w := httptest.NewRecorder()

				handler.CreateTask(w, req)

				// 验证返回 400 Bad Request 状态码
				if w.Code != http.StatusBadRequest {
					t.Logf("Expected status 400 for invalid input %q, got %d", invalidInput, w.Code)
					return false
				}

				// 验证响应是有效的 JSON 错误响应
				var resp model.ErrorResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Logf("Failed to decode error response for input %q: %v", invalidInput, err)
					return false
				}

				// 验证错误响应包含 error 和 message 字段
				if resp.Error == "" {
					t.Logf("Error field is empty for input %q", invalidInput)
					return false
				}
				if resp.Message == "" {
					t.Logf("Message field is empty for input %q", invalidInput)
					return false
				}

				// 验证错误类型是 invalid_json 或 validation_error
				if resp.Error != "invalid_json" && resp.Error != "validation_error" {
					t.Logf("Expected error type 'invalid_json' or 'validation_error', got %q for input %q", resp.Error, invalidInput)
					return false
				}

				return true
			},
			genInvalidInput,
		))

	// 测试 UpdateTaskStatus 的无效输入
	genInvalidUpdateInput := gen.OneGenOf(
		// 无效的 JSON 格式
		gen.Const(`{"completed":`),       // 缺少值和结束括号
		gen.Const(`{"completed":}`),      // 缺少值
		gen.Const(`{completed:true}`),    // 缺少引号
		gen.Const(`{"completed":true,}`), // 多余的逗号
		gen.Const(`not json`),            // 完全不是 JSON
		gen.Const(``),                    // 空字符串
		gen.Const(`{`),                   // 不完整的 JSON
	)

	properties.Property("invalid parameters in update status return 400 status code",
		prop.ForAll(
			func(invalidInput string) bool {
				mockService := &mockTaskService{}
				handler := NewTaskHandler(mockService)

				// 发送 PATCH 请求更新任务状态
				req := httptest.NewRequest(http.MethodPatch, "/api/tasks/1/status", bytes.NewBufferString(invalidInput))
				req.SetPathValue("id", "1")
				w := httptest.NewRecorder()

				handler.UpdateTaskStatus(w, req)

				// 验证返回 400 Bad Request 状态码
				if w.Code != http.StatusBadRequest {
					t.Logf("Expected status 400 for invalid update input %q, got %d", invalidInput, w.Code)
					return false
				}

				// 验证响应是有效的 JSON 错误响应
				var resp model.ErrorResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Logf("Failed to decode error response for update input %q: %v", invalidInput, err)
					return false
				}

				// 验证错误响应包含必要字段
				if resp.Error == "" || resp.Message == "" {
					t.Logf("Error response missing fields for input %q", invalidInput)
					return false
				}

				return true
			},
			genInvalidUpdateInput,
		))

	// 测试无效的 ID 参数
	properties.Property("invalid ID parameters return 400 status code",
		prop.ForAll(
			func(invalidID string) bool {
				// 跳过空字符串，因为它会导致 httptest.NewRequest panic
				if invalidID == "" {
					return true
				}

				mockService := &mockTaskService{}
				handler := NewTaskHandler(mockService)

				// 测试 GET /api/tasks/{id}
				req := httptest.NewRequest(http.MethodGet, "/api/tasks/"+invalidID, nil)
				req.SetPathValue("id", invalidID)
				w := httptest.NewRecorder()

				handler.GetTask(w, req)

				// 验证返回 400 Bad Request 状态码
				if w.Code != http.StatusBadRequest {
					t.Logf("Expected status 400 for invalid ID %q, got %d", invalidID, w.Code)
					return false
				}

				// 验证响应是有效的 JSON 错误响应
				var resp model.ErrorResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Logf("Failed to decode error response for ID %q: %v", invalidID, err)
					return false
				}

				// 验证错误响应包含必要字段
				if resp.Error == "" || resp.Message == "" {
					t.Logf("Error response missing fields for ID %q", invalidID)
					return false
				}

				return true
			},
			// 生成各种无效的 ID
			gen.OneGenOf(
				gen.Const("invalid"),
				gen.Const("abc"),
				gen.Const("-1"),
				gen.Const("0"),
				gen.Const("-999"),
				gen.Const("1.5"),
				gen.Const("1e10"),
				gen.Const("null"),
				gen.Const("xyz123"),
			),
		))

	properties.TestingRun(t)
}

// TestUpdateTask_Success 测试成功更新任务
func TestUpdateTask_Success(t *testing.T) {
	mockService := &mockTaskService{
		updateTaskFunc: func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
			return &model.Task{
				ID:          id,
				Title:       req.Title,
				Description: req.Description,
				Completed:   false,
				CreatedAt:   time.Now(),
			}, nil
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Updated Title","description":"Updated Description"}`
	req := httptest.NewRequest(http.MethodPut, "/api/tasks/1", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.UpdateTask(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp model.TaskResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data.Title != "Updated Title" {
		t.Errorf("expected title 'Updated Title', got '%s'", resp.Data.Title)
	}

	if resp.Data.Description != "Updated Description" {
		t.Errorf("expected description 'Updated Description', got '%s'", resp.Data.Description)
	}
}

// TestUpdateTask_InvalidID 测试无效 ID 返回 400
func TestUpdateTask_InvalidID(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Updated Title","description":"Updated Description"}`
	req := httptest.NewRequest(http.MethodPut, "/api/tasks/invalid", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "invalid")
	w := httptest.NewRecorder()

	handler.UpdateTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "invalid_id" {
		t.Errorf("expected error 'invalid_id', got '%s'", resp.Error)
	}
}

// TestUpdateTask_NotFound 测试任务不存在返回 404
func TestUpdateTask_NotFound(t *testing.T) {
	mockService := &mockTaskService{
		updateTaskFunc: func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
			return nil, repository.ErrNotFound
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Updated Title","description":"Updated Description"}`
	req := httptest.NewRequest(http.MethodPut, "/api/tasks/999", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "999")
	w := httptest.NewRecorder()

	handler.UpdateTask(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "not_found" {
		t.Errorf("expected error 'not_found', got '%s'", resp.Error)
	}
}

// TestUpdateTask_InvalidJSON 测试无效 JSON 返回 400
func TestUpdateTask_InvalidJSON(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"Updated Title",` // 无效 JSON
	req := httptest.NewRequest(http.MethodPut, "/api/tasks/1", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.UpdateTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "invalid_json" {
		t.Errorf("expected error 'invalid_json', got '%s'", resp.Error)
	}
}

// TestUpdateTask_ValidationFailure 测试验证失败返回 400
func TestUpdateTask_ValidationFailure(t *testing.T) {
	mockService := &mockTaskService{
		updateTaskFunc: func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
			return nil, &model.ValidationError{Field: "title", Message: "title cannot be empty"}
		},
	}

	handler := NewTaskHandler(mockService)

	reqBody := `{"title":"","description":"Updated Description"}`
	req := httptest.NewRequest(http.MethodPut, "/api/tasks/1", bytes.NewBufferString(reqBody))
	req.SetPathValue("id", "1")
	w := httptest.NewRecorder()

	handler.UpdateTask(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp model.ErrorResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "validation_error" {
		t.Errorf("expected error 'validation_error', got '%s'", resp.Error)
	}
}

// Feature: task-list-and-update, Property 11: 后端验证任务ID
// **Validates: Requirements 3.2, 3.3**
//
// 对于任何更新请求，如果任务ID无效或任务不存在，后端应该返回404状态码和适当的错误信息
func TestProperty_UpdateTask_ValidatesTaskID(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	// 生成无效的任务ID（负数、零、非常大的数字）
	genInvalidTaskID := gen.OneGenOf(
		gen.Int64Range(-1000, 0),        // 负数和零
		gen.Int64Range(999999, 9999999), // 不存在的大ID
	)

	properties.Property("invalid or non-existent task ID returns 404",
		prop.ForAll(
			func(taskID int64) bool {
				// 创建 mock service，对于任何ID都返回 NotFound 错误
				mockService := &mockTaskService{
					updateTaskFunc: func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
						return nil, repository.ErrNotFound
					},
				}

				handler := NewTaskHandler(mockService)

				// 创建有效的更新请求
				reqBody := `{"title":"Updated Title","description":"Updated Description"}`
				req := httptest.NewRequest(http.MethodPut, "/api/tasks/"+strconv.FormatInt(taskID, 10), bytes.NewBufferString(reqBody))

				// 对于无效ID（<=0），应该在解析阶段就返回400
				if taskID <= 0 {
					req.SetPathValue("id", strconv.FormatInt(taskID, 10))
					w := httptest.NewRecorder()
					handler.UpdateTask(w, req)

					// 无效ID应该返回400
					if w.Code != http.StatusBadRequest {
						t.Logf("Expected status 400 for invalid ID %d, got %d", taskID, w.Code)
						return false
					}

					var resp model.ErrorResponse
					if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
						t.Logf("Failed to decode error response: %v", err)
						return false
					}

					if resp.Error != "invalid_id" {
						t.Logf("Expected error 'invalid_id', got '%s'", resp.Error)
						return false
					}

					return true
				}

				// 对于有效格式但不存在的ID，应该返回404
				req.SetPathValue("id", strconv.FormatInt(taskID, 10))
				w := httptest.NewRecorder()
				handler.UpdateTask(w, req)

				// 验证返回404状态码
				if w.Code != http.StatusNotFound {
					t.Logf("Expected status 404 for non-existent ID %d, got %d", taskID, w.Code)
					return false
				}

				// 验证错误响应格式
				var resp model.ErrorResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Logf("Failed to decode error response: %v", err)
					return false
				}

				if resp.Error != "not_found" {
					t.Logf("Expected error 'not_found', got '%s'", resp.Error)
					return false
				}

				if resp.Message != "task not found" {
					t.Logf("Expected message 'task not found', got '%s'", resp.Message)
					return false
				}

				return true
			},
			genInvalidTaskID,
		))

	properties.TestingRun(t)
}

// Feature: task-list-and-update, Property 12: 后端验证标题字段
// **Validates: Requirements 3.4, 3.5**
//
// 对于任何更新请求，如果title字段为空或仅包含空白字符，后端应该返回400状态码和验证错误信息
func TestProperty_UpdateTask_ValidatesTitleField(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	// 生成各种无效的标题（空字符串、空白字符、超长字符串）
	genInvalidTitle := gen.OneGenOf(
		gen.Const(""),                        // 空字符串
		gen.Const("   "),                     // 仅空格
		gen.Const("\t"),                      // 仅制表符
		gen.Const("\n"),                      // 仅换行符
		gen.Const("  \t\n  "),                // 混合空白字符
		gen.Const(strings.Repeat("a", 201)),  // 超过200字符
		gen.Const(strings.Repeat("测试", 101)), // 超过200字符（中文）
	)

	properties.Property("empty or whitespace-only title returns 400 validation error",
		prop.ForAll(
			func(invalidTitle string) bool {
				// 创建 mock service，验证失败时返回 ValidationError
				mockService := &mockTaskService{
					updateTaskFunc: func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
						// 使用实际的验证逻辑
						if err := req.Validate(); err != nil {
							return nil, err
						}
						// 如果验证通过（不应该发生），返回任务
						return &model.Task{
							ID:          id,
							Title:       req.Title,
							Description: req.Description,
							Completed:   false,
							CreatedAt:   time.Now(),
						}, nil
					},
				}

				handler := NewTaskHandler(mockService)

				// 创建包含无效标题的更新请求
				reqBody := map[string]string{
					"title":       invalidTitle,
					"description": "Test Description",
				}
				reqJSON, _ := json.Marshal(reqBody)

				req := httptest.NewRequest(http.MethodPut, "/api/tasks/1", bytes.NewBuffer(reqJSON))
				req.SetPathValue("id", "1")
				w := httptest.NewRecorder()

				handler.UpdateTask(w, req)

				// 验证返回400状态码
				if w.Code != http.StatusBadRequest {
					t.Logf("Expected status 400 for invalid title %q, got %d", invalidTitle, w.Code)
					return false
				}

				// 验证错误响应格式
				var resp model.ErrorResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Logf("Failed to decode error response: %v", err)
					return false
				}

				if resp.Error != "validation_error" {
					t.Logf("Expected error 'validation_error', got '%s'", resp.Error)
					return false
				}

				// 验证错误消息包含标题相关的信息
				if !strings.Contains(resp.Message, "title") {
					t.Logf("Expected error message to contain 'title', got '%s'", resp.Message)
					return false
				}

				return true
			},
			genInvalidTitle,
		))

	// 测试无效的JSON格式
	genInvalidJSON := gen.OneGenOf(
		gen.Const(`{"title":"Test"`),                 // 缺少结束括号
		gen.Const(`{"title":"Test","description":}`), // 缺少值
		gen.Const(`{title:"Test"}`),                  // 缺少引号
		gen.Const(`not json`),                        // 完全不是JSON
		gen.Const(``),                                // 空字符串
	)

	properties.Property("invalid JSON format returns 400 error",
		prop.ForAll(
			func(invalidJSON string) bool {
				mockService := &mockTaskService{}
				handler := NewTaskHandler(mockService)

				req := httptest.NewRequest(http.MethodPut, "/api/tasks/1", bytes.NewBufferString(invalidJSON))
				req.SetPathValue("id", "1")
				w := httptest.NewRecorder()

				handler.UpdateTask(w, req)

				// 验证返回400状态码
				if w.Code != http.StatusBadRequest {
					t.Logf("Expected status 400 for invalid JSON %q, got %d", invalidJSON, w.Code)
					return false
				}

				var resp model.ErrorResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Logf("Failed to decode error response: %v", err)
					return false
				}

				if resp.Error != "invalid_json" {
					t.Logf("Expected error 'invalid_json', got '%s'", resp.Error)
					return false
				}

				return true
			},
			genInvalidJSON,
		))

	properties.TestingRun(t)
}

// Feature: task-list-and-update, Property 13: 成功更新返回正确响应
// **Validates: Requirements 3.6, 3.7**
//
// 对于任何有效的更新请求，当数据库操作成功时，后端应该返回200状态码和更新后的完整任务对象
func TestProperty_UpdateTask_SuccessfulUpdateReturnsCorrectResponse(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	// 生成有效的任务ID（正整数）
	genValidTaskID := gen.Int64Range(1, 10000)

	// 生成有效的标题（1-200字符，非空白）
	genValidTitle := gen.OneGenOf(
		gen.AlphaString().SuchThat(func(s string) bool {
			return len(strings.TrimSpace(s)) > 0 && len(strings.TrimSpace(s)) <= 200
		}),
		gen.Const("Valid Task Title"),
		gen.Const("任务标题"),
		gen.Const("Task with emoji 🎉"),
	)

	// 生成有效的描述（0-1000字符）
	genValidDescription := gen.OneGenOf(
		gen.AlphaString().SuchThat(func(s string) bool {
			return len(s) <= 1000
		}),
		gen.Const(""),
		gen.Const("Valid description"),
		gen.Const("描述内容"),
	)

	properties.Property("valid update request returns 200 with updated task",
		prop.ForAll(
			func(taskID int64, title string, description string) bool {
				// 确保标题有效
				title = strings.TrimSpace(title)
				if title == "" || len(title) > 200 {
					return true // 跳过无效输入
				}
				if len(description) > 1000 {
					return true // 跳过无效输入
				}

				originalCreatedAt := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
				originalCompleted := taskID%2 == 0 // 随机设置完成状态

				// 创建 mock service，返回更新后的任务
				mockService := &mockTaskService{
					updateTaskFunc: func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
						// 验证请求
						if err := req.Validate(); err != nil {
							return nil, err
						}

						// 返回更新后的任务，保持ID、completed、created_at不变
						return &model.Task{
							ID:          id,
							Title:       req.Title,
							Description: req.Description,
							Completed:   originalCompleted,
							CreatedAt:   originalCreatedAt,
						}, nil
					},
				}

				handler := NewTaskHandler(mockService)

				// 创建有效的更新请求
				reqBody := map[string]string{
					"title":       title,
					"description": description,
				}
				reqJSON, _ := json.Marshal(reqBody)

				req := httptest.NewRequest(http.MethodPut, "/api/tasks/"+strconv.FormatInt(taskID, 10), bytes.NewBuffer(reqJSON))
				req.SetPathValue("id", strconv.FormatInt(taskID, 10))
				w := httptest.NewRecorder()

				handler.UpdateTask(w, req)

				// 验证返回200状态码
				if w.Code != http.StatusOK {
					t.Logf("Expected status 200 for valid update, got %d", w.Code)
					return false
				}

				// 验证响应格式
				var resp model.TaskResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Logf("Failed to decode response: %v", err)
					return false
				}

				// 验证返回的任务对象包含所有必需字段
				if resp.Data == nil {
					t.Logf("Response data is nil")
					return false
				}

				// 验证ID保持不变
				if resp.Data.ID != taskID {
					t.Logf("Expected ID %d, got %d", taskID, resp.Data.ID)
					return false
				}

				// 验证标题和描述已更新
				if resp.Data.Title != title {
					t.Logf("Expected title %q, got %q", title, resp.Data.Title)
					return false
				}

				if resp.Data.Description != description {
					t.Logf("Expected description %q, got %q", description, resp.Data.Description)
					return false
				}

				// 验证completed和created_at保持不变
				if resp.Data.Completed != originalCompleted {
					t.Logf("Expected completed %v, got %v", originalCompleted, resp.Data.Completed)
					return false
				}

				if !resp.Data.CreatedAt.Equal(originalCreatedAt) {
					t.Logf("Expected created_at %v, got %v", originalCreatedAt, resp.Data.CreatedAt)
					return false
				}

				// 验证Content-Type是application/json
				contentType := w.Header().Get("Content-Type")
				if contentType != "application/json" {
					t.Logf("Expected Content-Type 'application/json', got '%s'", contentType)
					return false
				}

				return true
			},
			genValidTaskID,
			genValidTitle,
			genValidDescription,
		))

	properties.TestingRun(t)
}
