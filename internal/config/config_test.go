package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	// 验证数据库默认配置
	if cfg.Database.Path != "memo.db" {
		t.Errorf("expected default DB path 'memo.db', got '%s'", cfg.Database.Path)
	}

	// 验证服务器默认配置
	if cfg.Server.Port != "8080" {
		t.Errorf("expected default port '8080', got '%s'", cfg.Server.Port)
	}
	if cfg.Server.ReadTimeout != 15 {
		t.Errorf("expected default read timeout 15, got %d", cfg.Server.ReadTimeout)
	}
	if cfg.Server.WriteTimeout != 15 {
		t.Errorf("expected default write timeout 15, got %d", cfg.Server.WriteTimeout)
	}
	if cfg.Server.IdleTimeout != 60 {
		t.Errorf("expected default idle timeout 60, got %d", cfg.Server.IdleTimeout)
	}
}

func TestLoadFromEnv(t *testing.T) {
	// 保存原始环境变量
	originalEnv := map[string]string{
		"DB_PATH":       os.Getenv("DB_PATH"),
		"PORT":          os.Getenv("PORT"),
		"READ_TIMEOUT":  os.Getenv("READ_TIMEOUT"),
		"WRITE_TIMEOUT": os.Getenv("WRITE_TIMEOUT"),
		"IDLE_TIMEOUT":  os.Getenv("IDLE_TIMEOUT"),
	}
	defer func() {
		// 恢复原始环境变量
		for key, val := range originalEnv {
			if val == "" {
				os.Unsetenv(key)
			} else {
				os.Setenv(key, val)
			}
		}
	}()

	// 设置测试环境变量
	os.Setenv("DB_PATH", "/tmp/test.db")
	os.Setenv("PORT", "9090")
	os.Setenv("READ_TIMEOUT", "30")
	os.Setenv("WRITE_TIMEOUT", "45")
	os.Setenv("IDLE_TIMEOUT", "120")

	cfg := DefaultConfig()
	loadFromEnv(cfg)

	// 验证环境变量被正确加载
	if cfg.Database.Path != "/tmp/test.db" {
		t.Errorf("expected DB path '/tmp/test.db', got '%s'", cfg.Database.Path)
	}
	if cfg.Server.Port != "9090" {
		t.Errorf("expected port '9090', got '%s'", cfg.Server.Port)
	}
	if cfg.Server.ReadTimeout != 30 {
		t.Errorf("expected read timeout 30, got %d", cfg.Server.ReadTimeout)
	}
	if cfg.Server.WriteTimeout != 45 {
		t.Errorf("expected write timeout 45, got %d", cfg.Server.WriteTimeout)
	}
	if cfg.Server.IdleTimeout != 120 {
		t.Errorf("expected idle timeout 120, got %d", cfg.Server.IdleTimeout)
	}
}

func TestLoadFromEnvInvalidValues(t *testing.T) {
	// 保存原始环境变量
	originalEnv := map[string]string{
		"READ_TIMEOUT":  os.Getenv("READ_TIMEOUT"),
		"WRITE_TIMEOUT": os.Getenv("WRITE_TIMEOUT"),
		"IDLE_TIMEOUT":  os.Getenv("IDLE_TIMEOUT"),
	}
	defer func() {
		for key, val := range originalEnv {
			if val == "" {
				os.Unsetenv(key)
			} else {
				os.Setenv(key, val)
			}
		}
	}()

	// 设置无效的环境变量
	os.Setenv("READ_TIMEOUT", "invalid")
	os.Setenv("WRITE_TIMEOUT", "-10")
	os.Setenv("IDLE_TIMEOUT", "0")

	cfg := DefaultConfig()
	loadFromEnv(cfg)

	// 验证无效值被忽略，使用默认值
	if cfg.Server.ReadTimeout != 15 {
		t.Errorf("expected default read timeout 15 for invalid value, got %d", cfg.Server.ReadTimeout)
	}
	if cfg.Server.WriteTimeout != 15 {
		t.Errorf("expected default write timeout 15 for negative value, got %d", cfg.Server.WriteTimeout)
	}
	if cfg.Server.IdleTimeout != 60 {
		t.Errorf("expected default idle timeout 60 for zero value, got %d", cfg.Server.IdleTimeout)
	}
}

func TestLoadFromFile(t *testing.T) {
	// 创建临时配置文件
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.json")

	configContent := `{
		"database": {
			"path": "/custom/path/memo.db"
		},
		"server": {
			"port": "3000",
			"read_timeout": 20,
			"write_timeout": 25,
			"idle_timeout": 90
		}
	}`

	if err := os.WriteFile(configPath, []byte(configContent), 0644); err != nil {
		t.Fatalf("failed to create test config file: %v", err)
	}

	cfg := DefaultConfig()
	if err := loadFromFile(cfg, configPath); err != nil {
		t.Fatalf("failed to load config from file: %v", err)
	}

	// 验证配置文件被正确加载
	if cfg.Database.Path != "/custom/path/memo.db" {
		t.Errorf("expected DB path '/custom/path/memo.db', got '%s'", cfg.Database.Path)
	}
	if cfg.Server.Port != "3000" {
		t.Errorf("expected port '3000', got '%s'", cfg.Server.Port)
	}
	if cfg.Server.ReadTimeout != 20 {
		t.Errorf("expected read timeout 20, got %d", cfg.Server.ReadTimeout)
	}
	if cfg.Server.WriteTimeout != 25 {
		t.Errorf("expected write timeout 25, got %d", cfg.Server.WriteTimeout)
	}
	if cfg.Server.IdleTimeout != 90 {
		t.Errorf("expected idle timeout 90, got %d", cfg.Server.IdleTimeout)
	}
}

func TestLoadFromFileNotFound(t *testing.T) {
	cfg := DefaultConfig()
	err := loadFromFile(cfg, "/nonexistent/config.json")

	if err == nil {
		t.Error("expected error for nonexistent config file, got nil")
	}
}

func TestLoadFromFileInvalidJSON(t *testing.T) {
	// 创建临时配置文件
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "invalid.json")

	invalidContent := `{invalid json content`
	if err := os.WriteFile(configPath, []byte(invalidContent), 0644); err != nil {
		t.Fatalf("failed to create test config file: %v", err)
	}

	cfg := DefaultConfig()
	err := loadFromFile(cfg, configPath)

	if err == nil {
		t.Error("expected error for invalid JSON, got nil")
	}
}

func TestLoad(t *testing.T) {
	// 保存原始环境变量
	originalConfigFile := os.Getenv("CONFIG_FILE")
	originalPort := os.Getenv("PORT")
	defer func() {
		if originalConfigFile == "" {
			os.Unsetenv("CONFIG_FILE")
		} else {
			os.Setenv("CONFIG_FILE", originalConfigFile)
		}
		if originalPort == "" {
			os.Unsetenv("PORT")
		} else {
			os.Setenv("PORT", originalPort)
		}
	}()

	// 创建临时配置文件
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.json")

	configContent := `{
		"database": {
			"path": "file.db"
		},
		"server": {
			"port": "5000"
		}
	}`

	if err := os.WriteFile(configPath, []byte(configContent), 0644); err != nil {
		t.Fatalf("failed to create test config file: %v", err)
	}

	// 设置环境变量
	os.Setenv("CONFIG_FILE", configPath)
	os.Setenv("PORT", "7000") // 环境变量应该覆盖配置文件

	cfg, err := Load()
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	// 验证配置文件被加载
	if cfg.Database.Path != "file.db" {
		t.Errorf("expected DB path 'file.db', got '%s'", cfg.Database.Path)
	}

	// 验证环境变量覆盖配置文件
	if cfg.Server.Port != "7000" {
		t.Errorf("expected port '7000' (from env), got '%s'", cfg.Server.Port)
	}
}

func TestLoadWithoutConfigFile(t *testing.T) {
	// 保存原始环境变量
	originalConfigFile := os.Getenv("CONFIG_FILE")
	defer func() {
		if originalConfigFile == "" {
			os.Unsetenv("CONFIG_FILE")
		} else {
			os.Setenv("CONFIG_FILE", originalConfigFile)
		}
	}()

	// 确保没有设置 CONFIG_FILE
	os.Unsetenv("CONFIG_FILE")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	// 验证使用默认配置
	if cfg.Database.Path != "memo.db" {
		t.Errorf("expected default DB path 'memo.db', got '%s'", cfg.Database.Path)
	}
	if cfg.Server.Port != "8080" {
		t.Errorf("expected default port '8080', got '%s'", cfg.Server.Port)
	}
}

func TestServerConfigTimeoutMethods(t *testing.T) {
	cfg := &ServerConfig{
		ReadTimeout:  10,
		WriteTimeout: 20,
		IdleTimeout:  30,
	}

	if cfg.GetReadTimeout() != 10*time.Second {
		t.Errorf("expected read timeout 10s, got %v", cfg.GetReadTimeout())
	}
	if cfg.GetWriteTimeout() != 20*time.Second {
		t.Errorf("expected write timeout 20s, got %v", cfg.GetWriteTimeout())
	}
	if cfg.GetIdleTimeout() != 30*time.Second {
		t.Errorf("expected idle timeout 30s, got %v", cfg.GetIdleTimeout())
	}
}

func TestCORSConfigParseAllowedOrigins(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "empty string returns empty slice",
			input:    "",
			expected: []string{},
		},
		{
			name:     "single origin",
			input:    "http://localhost:3000",
			expected: []string{"http://localhost:3000"},
		},
		{
			name:     "multiple origins",
			input:    "http://localhost:3000,https://app.example.com",
			expected: []string{"http://localhost:3000", "https://app.example.com"},
		},
		{
			name:     "origins with spaces",
			input:    "http://localhost:3000 , https://app.example.com , http://192.168.1.100:8080",
			expected: []string{"http://localhost:3000", "https://app.example.com", "http://192.168.1.100:8080"},
		},
		{
			name:     "origins with tabs and newlines",
			input:    "http://localhost:3000\t,\nhttps://app.example.com",
			expected: []string{"http://localhost:3000", "https://app.example.com"},
		},
		{
			name:     "trailing comma",
			input:    "http://localhost:3000,https://app.example.com,",
			expected: []string{"http://localhost:3000", "https://app.example.com"},
		},
		{
			name:     "leading comma",
			input:    ",http://localhost:3000,https://app.example.com",
			expected: []string{"http://localhost:3000", "https://app.example.com"},
		},
		{
			name:     "multiple consecutive commas",
			input:    "http://localhost:3000,,https://app.example.com",
			expected: []string{"http://localhost:3000", "https://app.example.com"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &CORSConfig{AllowedOrigins: tt.input}
			result := cfg.ParseAllowedOrigins()

			if len(result) != len(tt.expected) {
				t.Errorf("expected %d origins, got %d", len(tt.expected), len(result))
				return
			}

			for i, expected := range tt.expected {
				if result[i] != expected {
					t.Errorf("at index %d: expected '%s', got '%s'", i, expected, result[i])
				}
			}
		})
	}
}

func TestLoadCORSConfigFromEnv(t *testing.T) {
	// 保存原始环境变量
	originalCORSOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	defer func() {
		if originalCORSOrigins == "" {
			os.Unsetenv("CORS_ALLOWED_ORIGINS")
		} else {
			os.Setenv("CORS_ALLOWED_ORIGINS", originalCORSOrigins)
		}
	}()

	// 测试设置 CORS 配置
	os.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,https://app.example.com")

	cfg := DefaultConfig()
	loadFromEnv(cfg)

	if cfg.CORS.AllowedOrigins != "http://localhost:3000,https://app.example.com" {
		t.Errorf("expected CORS allowed origins 'http://localhost:3000,https://app.example.com', got '%s'", cfg.CORS.AllowedOrigins)
	}

	// 验证 ParseAllowedOrigins 方法
	origins := cfg.CORS.ParseAllowedOrigins()
	if len(origins) != 2 {
		t.Errorf("expected 2 origins, got %d", len(origins))
	}
	if origins[0] != "http://localhost:3000" {
		t.Errorf("expected first origin 'http://localhost:3000', got '%s'", origins[0])
	}
	if origins[1] != "https://app.example.com" {
		t.Errorf("expected second origin 'https://app.example.com', got '%s'", origins[1])
	}
}

func TestLoadCORSConfigFromEnvEmpty(t *testing.T) {
	// 保存原始环境变量
	originalCORSOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	defer func() {
		if originalCORSOrigins == "" {
			os.Unsetenv("CORS_ALLOWED_ORIGINS")
		} else {
			os.Setenv("CORS_ALLOWED_ORIGINS", originalCORSOrigins)
		}
	}()

	// 确保环境变量未设置
	os.Unsetenv("CORS_ALLOWED_ORIGINS")

	cfg := DefaultConfig()
	loadFromEnv(cfg)

	// 验证 CORS 配置为空（表示允许所有源）
	if cfg.CORS.AllowedOrigins != "" {
		t.Errorf("expected empty CORS allowed origins, got '%s'", cfg.CORS.AllowedOrigins)
	}

	// 验证 ParseAllowedOrigins 返回空切片
	origins := cfg.CORS.ParseAllowedOrigins()
	if len(origins) != 0 {
		t.Errorf("expected 0 origins for empty config, got %d", len(origins))
	}
}
