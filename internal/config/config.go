package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config 应用配置结构
type Config struct {
	// Database 数据库配置
	Database DatabaseConfig `json:"database"`
	// Server HTTP 服务器配置
	Server ServerConfig `json:"server"`
	// CORS 跨域资源共享配置
	CORS CORSConfig `json:"cors"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	// Path SQLite 数据库文件路径
	Path string `json:"path"`
}

// ServerConfig HTTP 服务器配置
type ServerConfig struct {
	// Port HTTP 服务器监听端口
	Port string `json:"port"`
	// ReadTimeout 读取超时时间（秒）
	ReadTimeout int `json:"read_timeout"`
	// WriteTimeout 写入超时时间（秒）
	WriteTimeout int `json:"write_timeout"`
	// IdleTimeout 空闲超时时间（秒）
	IdleTimeout int `json:"idle_timeout"`
}

// CORSConfig CORS 相关配置
type CORSConfig struct {
	// AllowedOrigins 允许的源列表（逗号分隔）
	// 从环境变量 CORS_ALLOWED_ORIGINS 读取
	// 如果为空，则允许所有源
	AllowedOrigins string `json:"allowed_origins"`
}

// DefaultConfig 返回默认配置
func DefaultConfig() *Config {
	return &Config{
		Database: DatabaseConfig{
			Path: "memo.db",
		},
		Server: ServerConfig{
			Port:         "8080",
			ReadTimeout:  15,
			WriteTimeout: 15,
			IdleTimeout:  60,
		},
	}
}

// Load 加载配置
// 优先级：环境变量 > 配置文件 > 默认值
func Load() (*Config, error) {
	cfg := DefaultConfig()

	// 尝试从配置文件加载
	if configPath := os.Getenv("CONFIG_FILE"); configPath != "" {
		if err := loadFromFile(cfg, configPath); err != nil {
			return nil, fmt.Errorf("failed to load config file: %w", err)
		}
	}

	// 环境变量覆盖配置文件
	loadFromEnv(cfg)

	return cfg, nil
}

// loadFromFile 从 JSON 配置文件加载配置
func loadFromFile(cfg *Config, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, cfg)
}

// loadFromEnv 从环境变量加载配置
func loadFromEnv(cfg *Config) {
	// 数据库配置
	if dbPath := os.Getenv("DB_PATH"); dbPath != "" {
		cfg.Database.Path = dbPath
	}

	// 服务器配置
	if port := os.Getenv("PORT"); port != "" {
		cfg.Server.Port = port
	}

	if readTimeout := os.Getenv("READ_TIMEOUT"); readTimeout != "" {
		if val, err := strconv.Atoi(readTimeout); err == nil && val > 0 {
			cfg.Server.ReadTimeout = val
		}
	}

	if writeTimeout := os.Getenv("WRITE_TIMEOUT"); writeTimeout != "" {
		if val, err := strconv.Atoi(writeTimeout); err == nil && val > 0 {
			cfg.Server.WriteTimeout = val
		}
	}

	if idleTimeout := os.Getenv("IDLE_TIMEOUT"); idleTimeout != "" {
		if val, err := strconv.Atoi(idleTimeout); err == nil && val > 0 {
			cfg.Server.IdleTimeout = val
		}
	}

	// CORS 配置
	if allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); allowedOrigins != "" {
		cfg.CORS.AllowedOrigins = allowedOrigins
	}
}

// GetReadTimeout 返回读取超时时间
func (c *ServerConfig) GetReadTimeout() time.Duration {
	return time.Duration(c.ReadTimeout) * time.Second
}

// GetWriteTimeout 返回写入超时时间
func (c *ServerConfig) GetWriteTimeout() time.Duration {
	return time.Duration(c.WriteTimeout) * time.Second
}

// GetIdleTimeout 返回空闲超时时间
func (c *ServerConfig) GetIdleTimeout() time.Duration {
	return time.Duration(c.IdleTimeout) * time.Second
}

// ParseAllowedOrigins 解析逗号分隔的源列表
// 返回清理后的源列表（去除空白字符）
// 如果 AllowedOrigins 为空，返回空切片（表示允许所有源）
func (c *CORSConfig) ParseAllowedOrigins() []string {
	if c.AllowedOrigins == "" {
		return []string{}
	}

	origins := []string{}
	for _, origin := range splitAndTrim(c.AllowedOrigins, ",") {
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	return origins
}

// splitAndTrim 分割字符串并去除每个元素的空白字符
func splitAndTrim(s, sep string) []string {
	parts := []string{}
	for _, part := range splitString(s, sep) {
		trimmed := trimSpace(part)
		parts = append(parts, trimmed)
	}
	return parts
}

// splitString 分割字符串
func splitString(s, sep string) []string {
	if s == "" {
		return []string{}
	}

	result := []string{}
	current := ""

	for i := 0; i < len(s); i++ {
		if i+len(sep) <= len(s) && s[i:i+len(sep)] == sep {
			result = append(result, current)
			current = ""
			i += len(sep) - 1
		} else {
			current += string(s[i])
		}
	}

	result = append(result, current)
	return result
}

// trimSpace 去除字符串首尾空白字符
func trimSpace(s string) string {
	start := 0
	end := len(s)

	// 去除开头空白
	for start < end && isSpace(s[start]) {
		start++
	}

	// 去除结尾空白
	for end > start && isSpace(s[end-1]) {
		end--
	}

	return s[start:end]
}

// isSpace 判断字符是否为空白字符
func isSpace(c byte) bool {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r'
}
