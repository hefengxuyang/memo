package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"memo/internal/middleware"
	"memo/internal/model"
)

// getTestCORSConfig 返回测试用的 CORS 配置
func getTestCORSConfig() middleware.CORSConfig {
	return middleware.CORSConfig{
		AllowedOrigins:   []string{}, // 允许所有源
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		MaxAge:           3600,
		AllowCredentials: true,
	}
}

// TestSetupRoutes 测试路由配置
func TestSetupRoutes(t *testing.T) {
	// 创建 mock service
	mockService := &mockTaskService{}

	// 创建 handler
	handler := NewTaskHandler(mockService)

	// 设置路由
	router := SetupRoutes(handler, getTestCORSConfig())

	// 测试用例
	tests := []struct {
		name           string
		method         string
		path           string
		body           interface{}
		setupMock      func()
		expectedStatus int
		checkResponse  func(t *testing.T, resp *http.Response)
	}{
		{
			name:   "POST /api/tasks - 创建任务",
			method: http.MethodPost,
			path:   "/api/tasks",
			body: model.CreateTaskRequest{
				Title:       "Test Task",
				Description: "Test Description",
			},
			setupMock: func() {
				mockService.createTaskFunc = func(ctx context.Context, req model.CreateTaskRequest) (*model.Task, error) {
					task := &model.Task{
						ID:          1,
						Title:       req.Title,
						Description: req.Description,
						Completed:   false,
						CreatedAt:   time.Now(),
					}
					return task, nil
				}
			},
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, resp *http.Response) {
				var response model.TaskResponse
				if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
					t.Fatalf("failed to decode response: %v", err)
				}
				if response.Data.Title != "Test Task" {
					t.Errorf("expected title 'Test Task', got '%s'", response.Data.Title)
				}
			},
		},
		{
			name:   "GET /api/tasks - 获取任务列表",
			method: http.MethodGet,
			path:   "/api/tasks",
			setupMock: func() {
				mockService.listTasksFunc = func(ctx context.Context) ([]*model.Task, error) {
					return []*model.Task{
						{
							ID:          1,
							Title:       "Task 1",
							Description: "Description 1",
							Completed:   false,
							CreatedAt:   time.Now(),
						},
					}, nil
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, resp *http.Response) {
				var response model.TaskListResponse
				if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
					t.Fatalf("failed to decode response: %v", err)
				}
				if len(response.Data) != 1 {
					t.Errorf("expected 1 task, got %d", len(response.Data))
				}
			},
		},
		{
			name:   "GET /api/tasks/{id} - 获取单个任务",
			method: http.MethodGet,
			path:   "/api/tasks/1",
			setupMock: func() {
				mockService.getTaskFunc = func(ctx context.Context, id int64) (*model.Task, error) {
					return &model.Task{
						ID:          id,
						Title:       "Task 1",
						Description: "Description 1",
						Completed:   false,
						CreatedAt:   time.Now(),
					}, nil
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, resp *http.Response) {
				var response model.TaskResponse
				if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
					t.Fatalf("failed to decode response: %v", err)
				}
				if response.Data.ID != 1 {
					t.Errorf("expected ID 1, got %d", response.Data.ID)
				}
			},
		},
		{
			name:   "PATCH /api/tasks/{id}/status - 更新任务状态",
			method: http.MethodPatch,
			path:   "/api/tasks/1/status",
			body: model.UpdateTaskStatusRequest{
				Completed: true,
			},
			setupMock: func() {
				mockService.updateTaskStatusFunc = func(ctx context.Context, id int64, completed bool) (*model.Task, error) {
					return &model.Task{
						ID:          id,
						Title:       "Task 1",
						Description: "Description 1",
						Completed:   completed,
						CreatedAt:   time.Now(),
					}, nil
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, resp *http.Response) {
				var response model.TaskResponse
				if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
					t.Fatalf("failed to decode response: %v", err)
				}
				if !response.Data.Completed {
					t.Error("expected task to be completed")
				}
			},
		},
		{
			name:   "PUT /api/tasks/{id} - 更新任务",
			method: http.MethodPut,
			path:   "/api/tasks/1",
			body: model.UpdateTaskRequest{
				Title:       "Updated Task",
				Description: "Updated Description",
			},
			setupMock: func() {
				mockService.updateTaskFunc = func(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
					return &model.Task{
						ID:          id,
						Title:       req.Title,
						Description: req.Description,
						Completed:   false,
						CreatedAt:   time.Now(),
					}, nil
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, resp *http.Response) {
				var response model.TaskResponse
				if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
					t.Fatalf("failed to decode response: %v", err)
				}
				if response.Data.Title != "Updated Task" {
					t.Errorf("expected title 'Updated Task', got '%s'", response.Data.Title)
				}
				if response.Data.Description != "Updated Description" {
					t.Errorf("expected description 'Updated Description', got '%s'", response.Data.Description)
				}
			},
		},
		{
			name:   "DELETE /api/tasks/{id} - 删除任务",
			method: http.MethodDelete,
			path:   "/api/tasks/1",
			setupMock: func() {
				mockService.deleteTaskFunc = func(ctx context.Context, id int64) error {
					return nil
				}
			},
			expectedStatus: http.StatusNoContent,
			checkResponse: func(t *testing.T, resp *http.Response) {
				// 204 No Content 不应该有响应体
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 设置 mock
			if tt.setupMock != nil {
				tt.setupMock()
			}

			// 创建请求
			var req *http.Request
			if tt.body != nil {
				bodyBytes, _ := json.Marshal(tt.body)
				req = httptest.NewRequest(tt.method, tt.path, bytes.NewReader(bodyBytes))
				req.Header.Set("Content-Type", "application/json")
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}

			// 创建响应记录器
			w := httptest.NewRecorder()

			// 执行请求
			router.ServeHTTP(w, req)

			// 检查状态码
			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// 检查响应
			if tt.checkResponse != nil {
				tt.checkResponse(t, w.Result())
			}
		})
	}
}

// TestRouteNotFound 测试不存在的路由
func TestRouteNotFound(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)
	router := SetupRoutes(handler, getTestCORSConfig())

	req := httptest.NewRequest(http.MethodGet, "/api/nonexistent", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Code)
	}
}

// TestRouteMethodNotAllowed 测试不支持的 HTTP 方法
func TestRouteMethodNotAllowed(t *testing.T) {
	mockService := &mockTaskService{}
	handler := NewTaskHandler(mockService)
	router := SetupRoutes(handler, getTestCORSConfig())

	// 尝试对 /api/tasks 使用 PUT 方法（不支持）
	req := httptest.NewRequest(http.MethodPut, "/api/tasks", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status 405, got %d", w.Code)
	}
}
