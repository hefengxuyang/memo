package repository

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

// InitDB 初始化数据库连接并创建表结构
func InitDB(dataSourceName string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to open database: %v", ErrDatabaseConnection, err)
	}

	// 测试连接
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("%w: failed to ping database: %v", ErrDatabaseConnection, err)
	}

	// 配置数据库以支持并发访问
	if err := configureDB(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("%w: failed to configure database: %v", ErrDatabaseConnection, err)
	}

	// 创建表结构
	if err := createSchema(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("%w: failed to create schema: %v", ErrDatabaseConnection, err)
	}

	return db, nil
}

// configureDB 配置数据库以支持并发访问
func configureDB(db *sql.DB) error {
	// 启用 WAL 模式以支持并发读写
	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		return fmt.Errorf("failed to enable WAL mode: %v", err)
	}

	// 设置繁忙超时（毫秒）
	if _, err := db.Exec("PRAGMA busy_timeout=5000"); err != nil {
		return fmt.Errorf("failed to set busy timeout: %v", err)
	}

	// 设置连接池大小
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return nil
}

// createSchema 创建数据库表和索引
func createSchema(db *sql.DB) error {
	schema := `
		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			completed BOOLEAN NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
		CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
	`

	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to execute schema: %v", err)
	}

	return nil
}
