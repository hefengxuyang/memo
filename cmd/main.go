package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"memo/internal/config"
	"memo/internal/handler"
	"memo/internal/middleware"
	"memo/internal/repository"
	"memo/internal/service"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// 初始化数据库连接
	log.Printf("Initializing database connection: %s", cfg.Database.Path)
	db, err := repository.InitDB(cfg.Database.Path)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Println("Database initialized successfully")

	// 创建 repository、service、handler 实例
	repo := repository.NewSQLiteRepository(db)
	svc := service.NewTaskService(repo)
	taskHandler := handler.NewTaskHandler(svc)

	// 创建 CORS 中间件配置
	corsConfig := createCORSConfig(cfg)

	// 配置路由
	router := handler.SetupRoutes(taskHandler, corsConfig)

	// 创建 HTTP 服务器
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.GetReadTimeout(),
		WriteTimeout: cfg.Server.GetWriteTimeout(),
		IdleTimeout:  cfg.Server.GetIdleTimeout(),
	}

	// 启动服务器（在 goroutine 中）
	go func() {
		log.Printf("Starting HTTP server on port %s", cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Println("Server started successfully")

	// 实现优雅关闭
	gracefulShutdown(server, db)
}

// gracefulShutdown 处理优雅关闭
// 监听系统信号（SIGINT, SIGTERM），关闭 HTTP 服务器和数据库连接
func gracefulShutdown(server *http.Server, db interface{ Close() error }) {
	// 创建信号通道
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 等待信号
	sig := <-quit
	log.Printf("Received signal: %v, shutting down gracefully...", sig)

	// 创建关闭超时上下文
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 关闭 HTTP 服务器
	log.Println("Shutting down HTTP server...")
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Error shutting down server: %v", err)
	} else {
		log.Println("HTTP server shut down successfully")
	}

	// 关闭数据库连接
	log.Println("Closing database connection...")
	if err := db.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	} else {
		log.Println("Database connection closed successfully")
	}

	log.Println("Shutdown complete")
}

// createCORSConfig 创建 CORS 中间件配置
func createCORSConfig(cfg *config.Config) middleware.CORSConfig {
	return middleware.CORSConfig{
		AllowedOrigins:   cfg.CORS.ParseAllowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		MaxAge:           3600,
		AllowCredentials: true,
	}
}
