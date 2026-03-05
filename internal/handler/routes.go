package handler

import (
	"net/http"

	appMiddleware "memo/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// SetupRoutes 配置所有 API 路由
// 使用 chi 路由器提供 RESTful API 端点
func SetupRoutes(handler *TaskHandler, corsConfig appMiddleware.CORSConfig) http.Handler {
	r := chi.NewRouter()

	// 添加中间件
	// CORS 中间件必须首先注册，以确保所有请求都经过 CORS 处理
	r.Use(appMiddleware.NewCORSMiddleware(corsConfig))
	r.Use(middleware.Logger)    // 日志记录
	r.Use(middleware.Recoverer) // 恢复 panic
	r.Use(middleware.RequestID) // 请求 ID
	r.Use(middleware.RealIP)    // 真实 IP

	// API 路由组
	r.Route("/api/tasks", func(r chi.Router) {
		r.Post("/", handler.CreateTask)                   // POST /api/tasks - 创建任务
		r.Get("/", handler.ListTasks)                     // GET /api/tasks - 获取任务列表
		r.Get("/{id}", handler.GetTask)                   // GET /api/tasks/{id} - 获取单个任务
		r.Put("/{id}", handler.UpdateTask)                // PUT /api/tasks/{id} - 更新任务
		r.Patch("/{id}/status", handler.UpdateTaskStatus) // PATCH /api/tasks/{id}/status - 更新任务状态
		r.Delete("/{id}", handler.DeleteTask)             // DELETE /api/tasks/{id} - 删除任务
	})

	return r
}
