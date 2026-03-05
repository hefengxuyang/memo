package main

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"memo/internal/config"
	"memo/internal/handler"
	"memo/internal/middleware"
	"memo/internal/repository"
	"memo/internal/service"
)

// TestConfigLoad 测试配置加载
func TestConfigLoad(t *testing.T) {
	// 保存原始环境变量
	originalDBPath := os.Getenv("DB_PATH")
	originalPort := os.Getenv("PORT")
	defer func() {
		if originalDBPath == "" {
			os.Unsetenv("DB_PATH")
		} else {
			os.Setenv("DB_PATH", originalDBPath)
		}
		if originalPort == "" {
			os.Unsetenv("PORT")
		} else {
			os.Setenv("PORT", originalPort)
		}
	}()

	// 设置测试环境变量
	os.Setenv("DB_PATH", "test.db")
	os.Setenv("PORT", "9999")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	if cfg.Database.Path != "test.db" {
		t.Errorf("Expected DB path 'test.db', got '%s'", cfg.Database.Path)
	}
	if cfg.Server.Port != "9999" {
		t.Errorf("Expected port '9999', got '%s'", cfg.Server.Port)
	}
}

// TestServerInitialization 测试服务器初始化流程
func TestServerInitialization(t *testing.T) {
	// 使用内存数据库
	db, err := repository.InitDB(":memory:")
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// 创建 repository、service、handler 实例
	repo := repository.NewSQLiteRepository(db)
	svc := service.NewTaskService(repo)
	taskHandler := handler.NewTaskHandler(svc)

	// 创建测试 CORS 配置
	corsConfig := middleware.CORSConfig{
		AllowedOrigins:   []string{},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		MaxAge:           3600,
		AllowCredentials: true,
	}

	// 配置路由
	router := handler.SetupRoutes(taskHandler, corsConfig)

	// 验证路由不为空
	if router == nil {
		t.Fatal("Router should not be nil")
	}

	// 测试服务器可以处理请求
	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// 验证响应状态码（应该返回 200 OK 和空列表）
	if w.Code != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}
}

// TestGracefulShutdown 测试优雅关闭功能
func TestGracefulShutdown(t *testing.T) {
	// 创建测试服务器
	server := &http.Server{
		Addr:    ":0", // 使用随机端口
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}),
	}

	// 创建模拟数据库
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}

	// 在 goroutine 中启动服务器
	go func() {
		server.ListenAndServe()
	}()

	// 等待服务器启动
	time.Sleep(100 * time.Millisecond)

	// 测试关闭
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 关闭服务器
	if err := server.Shutdown(ctx); err != nil {
		t.Errorf("Server shutdown failed: %v", err)
	}

	// 关闭数据库
	if err := db.Close(); err != nil {
		t.Errorf("Database close failed: %v", err)
	}
}

// TestDatabaseInitialization 测试数据库初始化
func TestDatabaseInitialization(t *testing.T) {
	// 使用临时文件
	tmpFile := "test_memo.db"
	defer os.Remove(tmpFile)

	// 初始化数据库
	db, err := repository.InitDB(tmpFile)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// 验证数据库连接
	if err := db.Ping(); err != nil {
		t.Errorf("Database ping failed: %v", err)
	}

	// 验证表已创建
	var tableName string
	err = db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'").Scan(&tableName)
	if err != nil {
		t.Errorf("Failed to query tasks table: %v", err)
	}
	if tableName != "tasks" {
		t.Errorf("Expected table name 'tasks', got '%s'", tableName)
	}
}
