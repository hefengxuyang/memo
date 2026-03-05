package middleware

import (
	"log"
	"net/http"
	"net/url"
	"strings"
)

// CORSConfig 定义 CORS 中间件的配置
type CORSConfig struct {
	// AllowedOrigins 允许的源列表
	// 如果为空，则允许所有源
	AllowedOrigins []string

	// AllowedMethods 允许的 HTTP 方法
	AllowedMethods []string

	// AllowedHeaders 允许的请求头
	AllowedHeaders []string

	// MaxAge 预检请求的缓存时间（秒）
	MaxAge int

	// AllowCredentials 是否允许携带凭证
	AllowCredentials bool
}

// NewCORSMiddleware 创建新的 CORS 中间件
// 返回一个 chi 兼容的中间件函数
func NewCORSMiddleware(config CORSConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Panic 恢复机制
			defer func() {
				if err := recover(); err != nil {
					log.Printf("[CORS] Error: middleware panic: %v", err)
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				}
			}()

			// 获取请求的 Origin
			origin := r.Header.Get("Origin")

			// 验证 Origin 格式
			if origin != "" {
				if err := validateOrigin(origin); err != nil {
					log.Printf("[CORS] Warning: malformed origin header: %s", origin)
					// 继续处理请求，但不设置 CORS 头
					if r.Method != http.MethodOptions {
						next.ServeHTTP(w, r)
					} else {
						w.WriteHeader(http.StatusNoContent)
					}
					return
				}
			}

			// 检查源是否被允许
			allowedOrigin := getAllowOrigin(origin, config)
			allowed := allowedOrigin != ""

			// 调试日志：记录每个请求的 Origin 和是否被允许
			log.Printf("[CORS] Request from origin: %s, allowed: %v", origin, allowed)

			// 设置 CORS 响应头
			if allowedOrigin != "" {
				w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			}

			if config.AllowCredentials {
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}

			// 处理 OPTIONS 预检请求
			if r.Method == http.MethodOptions {
				setPreflightHeaders(w, config)
				w.WriteHeader(http.StatusNoContent)
				return
			}

			// 继续处理其他请求
			next.ServeHTTP(w, r)
		})
	}
}

// isOriginAllowed 检查源是否在允许列表中
func (c *CORSConfig) isOriginAllowed(origin string) bool {
	// 如果允许列表为空，允许所有源
	if len(c.AllowedOrigins) == 0 {
		return true
	}

	// 检查源是否在允许列表中
	for _, allowed := range c.AllowedOrigins {
		if allowed == origin {
			return true
		}
	}

	return false
}

// validateOrigin 验证 Origin 头的格式
func validateOrigin(origin string) error {
	if origin == "" {
		return nil
	}

	// 验证 Origin 格式（必须是有效的 URL）
	u, err := url.Parse(origin)
	if err != nil {
		return err
	}

	// Origin 必须包含 scheme 和 host
	if u.Scheme == "" || u.Host == "" {
		return url.InvalidHostError("invalid origin format")
	}

	return nil
}

// getAllowOrigin 获取应该设置的 Allow-Origin 值
func getAllowOrigin(origin string, config CORSConfig) string {
	// 如果没有 Origin 头
	if origin == "" {
		// 如果允许列表为空，返回 "*"
		if len(config.AllowedOrigins) == 0 {
			return "*"
		}
		// 否则不设置 Allow-Origin
		return ""
	}

	// 如果允许列表为空或源在允许列表中，返回请求的源
	if len(config.AllowedOrigins) == 0 || config.isOriginAllowed(origin) {
		return origin
	}

	// 源不被允许
	return ""
}

// setPreflightHeaders 设置预检响应头
func setPreflightHeaders(w http.ResponseWriter, config CORSConfig) {
	// 设置允许的方法
	if len(config.AllowedMethods) > 0 {
		methods := strings.Join(config.AllowedMethods, ", ")
		w.Header().Set("Access-Control-Allow-Methods", methods)
	}

	// 设置允许的请求头
	if len(config.AllowedHeaders) > 0 {
		headers := strings.Join(config.AllowedHeaders, ", ")
		w.Header().Set("Access-Control-Allow-Headers", headers)
	}

	// 设置预检缓存时间
	if config.MaxAge > 0 {
		w.Header().Set("Access-Control-Max-Age", intToString(config.MaxAge))
	}
}

// intToString 将整数转换为字符串
func intToString(n int) string {
	if n == 0 {
		return "0"
	}

	// 处理负数
	negative := n < 0
	if negative {
		n = -n
	}

	// 转换为字符串
	digits := []byte{}
	for n > 0 {
		digit := n % 10
		digits = append([]byte{byte('0' + digit)}, digits...)
		n /= 10
	}

	if negative {
		digits = append([]byte{'-'}, digits...)
	}

	return string(digits)
}
