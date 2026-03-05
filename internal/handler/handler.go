package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"memo/internal/model"
	"memo/internal/repository"
	"memo/internal/service"
)

// TaskHandler 处理任务相关的 HTTP 请求
type TaskHandler struct {
	service service.TaskService
}

// NewTaskHandler 创建新的 TaskHandler 实例
func NewTaskHandler(service service.TaskService) *TaskHandler {
	return &TaskHandler{service: service}
}

// CreateTask 处理创建任务请求
// POST /api/tasks
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 解析请求体
	var req model.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_json", "invalid JSON format")
		return
	}

	// 调用 service 创建任务
	task, err := h.service.CreateTask(ctx, req)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	// 返回成功响应
	respondJSON(w, http.StatusCreated, model.TaskResponse{Data: task})
}

// GetTask 处理获取单个任务请求
// GET /api/tasks/{id}
func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 解析路径参数
	id, err := parseIDFromPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "invalid task ID")
		return
	}

	// 调用 service 获取任务
	task, err := h.service.GetTask(ctx, id)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	// 返回成功响应
	respondJSON(w, http.StatusOK, model.TaskResponse{Data: task})
}

// ListTasks 处理获取任务列表请求
// GET /api/tasks
func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 调用 service 获取任务列表
	tasks, err := h.service.ListTasks(ctx)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	// 返回成功响应
	respondJSON(w, http.StatusOK, model.TaskListResponse{Data: tasks})
}

// UpdateTaskStatus 处理更新任务状态请求
// PATCH /api/tasks/{id}/status
func (h *TaskHandler) UpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 解析路径参数
	id, err := parseIDFromPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "invalid task ID")
		return
	}

	// 解析请求体
	var req model.UpdateTaskStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_json", "invalid JSON format")
		return
	}

	// 调用 service 更新任务状态
	task, err := h.service.UpdateTaskStatus(ctx, id, req.Completed)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	// 返回成功响应
	respondJSON(w, http.StatusOK, model.TaskResponse{Data: task})
}

// UpdateTask 处理更新任务请求
// PUT /api/tasks/{id}
func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 解析路径参数
	id, err := parseIDFromPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "invalid task ID")
		return
	}

	// 解析请求体
	var req model.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_json", "invalid JSON format")
		return
	}

	// 调用 service 更新任务
	task, err := h.service.UpdateTask(ctx, id, req)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	// 返回成功响应
	respondJSON(w, http.StatusOK, model.TaskResponse{Data: task})
}

// DeleteTask 处理删除任务请求
// DELETE /api/tasks/{id}
func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 解析路径参数
	id, err := parseIDFromPath(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid_id", "invalid task ID")
		return
	}

	// 调用 service 删除任务
	if err := h.service.DeleteTask(ctx, id); err != nil {
		handleServiceError(w, err)
		return
	}

	// 返回成功响应（204 No Content）
	w.WriteHeader(http.StatusNoContent)
}

// parseIDFromPath 从请求路径中解析任务 ID
func parseIDFromPath(r *http.Request) (int64, error) {
	idStr := r.PathValue("id")
	if idStr == "" {
		return 0, errors.New("missing id parameter")
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id parameter")
	}

	return id, nil
}

// handleServiceError 处理 service 层返回的错误，映射到适当的 HTTP 状态码
func handleServiceError(w http.ResponseWriter, err error) {
	// 检查是否是验证错误 (400 Bad Request)
	var validationErr *model.ValidationError
	if errors.As(err, &validationErr) {
		respondError(w, http.StatusBadRequest, "validation_error", validationErr.Message)
		return
	}

	// 检查是否是 NotFound 错误 (404 Not Found)
	if errors.Is(err, repository.ErrNotFound) {
		respondError(w, http.StatusNotFound, "not_found", "task not found")
		return
	}

	// 检查是否是数据库连接错误 (503 Service Unavailable)
	if errors.Is(err, repository.ErrDatabaseConnection) {
		log.Printf("Database connection error: %v", err)
		respondError(w, http.StatusServiceUnavailable, "service_unavailable", "service temporarily unavailable")
		return
	}

	// 检查是否是数据库操作错误 (500 Internal Server Error)
	if errors.Is(err, repository.ErrDatabaseOperation) {
		log.Printf("Database operation error: %v", err)
		respondError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	// 其他未知错误视为内部服务器错误 (500 Internal Server Error)
	log.Printf("Unexpected error: %v", err)
	respondError(w, http.StatusInternalServerError, "internal_error", "internal server error")
}

// respondJSON 发送 JSON 响应
func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// respondError 发送错误响应
func respondError(w http.ResponseWriter, statusCode int, errorType, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(model.ErrorResponse{
		Error:   errorType,
		Message: message,
	})
}
