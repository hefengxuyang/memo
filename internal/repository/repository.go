package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"memo/internal/model"

	_ "modernc.org/sqlite"
)

// TaskRepository 定义任务数据访问接口
type TaskRepository interface {
	// Create 创建新任务
	Create(ctx context.Context, task *model.Task) error

	// FindByID 根据 ID 查询任务
	FindByID(ctx context.Context, id int64) (*model.Task, error)

	// FindAll 查询所有任务
	FindAll(ctx context.Context) ([]*model.Task, error)

	// Update 更新任务信息
	Update(ctx context.Context, task *model.Task) error

	// Delete 删除任务
	Delete(ctx context.Context, id int64) error
}

// sqliteRepository SQLite 数据库实现
type sqliteRepository struct {
	db *sql.DB
}

// NewSQLiteRepository 创建新的 SQLite repository 实例
func NewSQLiteRepository(db *sql.DB) TaskRepository {
	return &sqliteRepository{db: db}
}

// ErrNotFound 表示任务不存在
var ErrNotFound = errors.New("task not found")

// ErrDatabaseConnection 表示数据库连接失败
var ErrDatabaseConnection = errors.New("database connection failed")

// ErrDatabaseOperation 表示数据库操作失败
var ErrDatabaseOperation = errors.New("database operation failed")

// Create 插入新任务到数据库
func (r *sqliteRepository) Create(ctx context.Context, task *model.Task) error {
	query := `
		INSERT INTO tasks (title, description, completed, created_at)
		VALUES (?, ?, ?, ?)
	`

	// 设置创建时间
	if task.CreatedAt.IsZero() {
		task.CreatedAt = time.Now()
	}

	result, err := r.db.ExecContext(ctx, query,
		task.Title,
		task.Description,
		task.Completed,
		task.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("%w: failed to create task: %v", ErrDatabaseOperation, err)
	}

	// 获取自动生成的 ID
	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("%w: failed to get last insert id: %v", ErrDatabaseOperation, err)
	}

	task.ID = id
	return nil
}

// FindByID 根据 ID 查询任务
func (r *sqliteRepository) FindByID(ctx context.Context, id int64) (*model.Task, error) {
	query := `
		SELECT id, title, description, completed, created_at
		FROM tasks
		WHERE id = ?
	`

	task := &model.Task{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&task.ID,
		&task.Title,
		&task.Description,
		&task.Completed,
		&task.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("%w: failed to find task: %v", ErrDatabaseOperation, err)
	}

	return task, nil
}

// FindAll 查询所有任务
func (r *sqliteRepository) FindAll(ctx context.Context) ([]*model.Task, error) {
	query := `
		SELECT id, title, description, completed, created_at
		FROM tasks
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to query tasks: %v", ErrDatabaseOperation, err)
	}
	defer rows.Close()

	tasks := []*model.Task{}
	for rows.Next() {
		task := &model.Task{}
		err := rows.Scan(
			&task.ID,
			&task.Title,
			&task.Description,
			&task.Completed,
			&task.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("%w: failed to scan task: %v", ErrDatabaseOperation, err)
		}
		tasks = append(tasks, task)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("%w: error iterating tasks: %v", ErrDatabaseOperation, err)
	}

	return tasks, nil
}

// Update 更新任务信息
func (r *sqliteRepository) Update(ctx context.Context, task *model.Task) error {
	query := `
		UPDATE tasks
		SET title = ?, description = ?, completed = ?
		WHERE id = ?
	`

	result, err := r.db.ExecContext(ctx, query,
		task.Title,
		task.Description,
		task.Completed,
		task.ID,
	)
	if err != nil {
		return fmt.Errorf("%w: failed to update task: %v", ErrDatabaseOperation, err)
	}

	// 检查是否有行被更新
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("%w: failed to get rows affected: %v", ErrDatabaseOperation, err)
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

// Delete 删除任务
func (r *sqliteRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM tasks WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("%w: failed to delete task: %v", ErrDatabaseOperation, err)
	}

	// 检查是否有行被删除
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("%w: failed to get rows affected: %v", ErrDatabaseOperation, err)
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}
