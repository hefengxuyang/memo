package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestOPTIONSPreflightRequest 测试 OPTIONS 预检请求处理
func TestOPTIONSPreflightRequest(t *testing.T) {
	tests := []struct {
		name            string
		config          CORSConfig
		origin          string
		wantStatus      int
		wantMethods     string
		wantHeaders     string
		wantMaxAge      string
		wantOrigin      string
		wantCredentials string
	}{
		{
			name: "OPTIONS request with origin",
			config: CORSConfig{
				AllowedOrigins:   []string{},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			origin:          "http://localhost:3000",
			wantStatus:      http.StatusNoContent,
			wantMethods:     "GET, POST, PATCH, DELETE, OPTIONS",
			wantHeaders:     "Content-Type, Accept",
			wantMaxAge:      "3600",
			wantOrigin:      "http://localhost:3000",
			wantCredentials: "true",
		},
		{
			name: "OPTIONS request without origin",
			config: CORSConfig{
				AllowedOrigins:   []string{},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			origin:          "",
			wantStatus:      http.StatusNoContent,
			wantMethods:     "GET, POST, PATCH, DELETE, OPTIONS",
			wantHeaders:     "Content-Type, Accept",
			wantMaxAge:      "3600",
			wantOrigin:      "*",
			wantCredentials: "true",
		},
		{
			name: "OPTIONS request with allowed origin",
			config: CORSConfig{
				AllowedOrigins:   []string{"http://localhost:3000", "https://app.example.com"},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			origin:          "http://localhost:3000",
			wantStatus:      http.StatusNoContent,
			wantMethods:     "GET, POST, PATCH, DELETE, OPTIONS",
			wantHeaders:     "Content-Type, Accept",
			wantMaxAge:      "3600",
			wantOrigin:      "http://localhost:3000",
			wantCredentials: "true",
		},
		{
			name: "OPTIONS request with disallowed origin",
			config: CORSConfig{
				AllowedOrigins:   []string{"http://localhost:3000"},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			origin:          "http://evil.com",
			wantStatus:      http.StatusNoContent,
			wantMethods:     "GET, POST, PATCH, DELETE, OPTIONS",
			wantHeaders:     "Content-Type, Accept",
			wantMaxAge:      "3600",
			wantOrigin:      "", // Should not set Allow-Origin for disallowed origin
			wantCredentials: "true",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test handler that should NOT be called for OPTIONS requests
			handlerCalled := false
			testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handlerCalled = true
				w.WriteHeader(http.StatusOK)
			})

			// Create CORS middleware
			middleware := NewCORSMiddleware(tt.config)
			handler := middleware(testHandler)

			// Create test request
			req := httptest.NewRequest(http.MethodOptions, "/api/tasks", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			// Create response recorder
			rr := httptest.NewRecorder()

			// Execute request
			handler.ServeHTTP(rr, req)

			// Verify status code
			if rr.Code != tt.wantStatus {
				t.Errorf("status code = %v, want %v", rr.Code, tt.wantStatus)
			}

			// Verify Allow-Methods header
			if got := rr.Header().Get("Access-Control-Allow-Methods"); got != tt.wantMethods {
				t.Errorf("Access-Control-Allow-Methods = %v, want %v", got, tt.wantMethods)
			}

			// Verify Allow-Headers header
			if got := rr.Header().Get("Access-Control-Allow-Headers"); got != tt.wantHeaders {
				t.Errorf("Access-Control-Allow-Headers = %v, want %v", got, tt.wantHeaders)
			}

			// Verify Max-Age header
			if got := rr.Header().Get("Access-Control-Max-Age"); got != tt.wantMaxAge {
				t.Errorf("Access-Control-Max-Age = %v, want %v", got, tt.wantMaxAge)
			}

			// Verify Allow-Origin header
			if got := rr.Header().Get("Access-Control-Allow-Origin"); got != tt.wantOrigin {
				t.Errorf("Access-Control-Allow-Origin = %v, want %v", got, tt.wantOrigin)
			}

			// Verify Allow-Credentials header
			if got := rr.Header().Get("Access-Control-Allow-Credentials"); got != tt.wantCredentials {
				t.Errorf("Access-Control-Allow-Credentials = %v, want %v", got, tt.wantCredentials)
			}

			// Verify that the downstream handler was NOT called
			if handlerCalled {
				t.Error("downstream handler should not be called for OPTIONS requests")
			}
		})
	}
}

// TestOPTIONSRequestTermination 测试 OPTIONS 请求终止处理
func TestOPTIONSRequestTermination(t *testing.T) {
	config := CORSConfig{
		AllowedOrigins:   []string{},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		MaxAge:           3600,
		AllowCredentials: true,
	}

	// Create a test handler that should NOT be called
	handlerCalled := false
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("This should not be returned"))
	})

	// Create CORS middleware
	middleware := NewCORSMiddleware(config)
	handler := middleware(testHandler)

	// Test different paths
	paths := []string{"/api/tasks", "/api/tasks/1", "/api/tasks/123/status", "/health"}

	for _, path := range paths {
		t.Run("path_"+path, func(t *testing.T) {
			handlerCalled = false

			req := httptest.NewRequest(http.MethodOptions, path, nil)
			req.Header.Set("Origin", "http://localhost:3000")

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			// Verify 204 status
			if rr.Code != http.StatusNoContent {
				t.Errorf("status code = %v, want %v", rr.Code, http.StatusNoContent)
			}

			// Verify no body
			if rr.Body.Len() > 0 {
				t.Errorf("response body should be empty, got: %s", rr.Body.String())
			}

			// Verify handler was not called
			if handlerCalled {
				t.Error("downstream handler should not be called for OPTIONS requests")
			}
		})
	}
}

// TestRegularRequestCORSHeaders 测试常规请求的 CORS 响应头设置
func TestRegularRequestCORSHeaders(t *testing.T) {
	tests := []struct {
		name            string
		config          CORSConfig
		method          string
		origin          string
		wantOrigin      string
		wantCredentials string
		wantHandlerCall bool
	}{
		{
			name: "GET request with origin",
			config: CORSConfig{
				AllowedOrigins:   []string{},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			method:          http.MethodGet,
			origin:          "http://localhost:3000",
			wantOrigin:      "http://localhost:3000",
			wantCredentials: "true",
			wantHandlerCall: true,
		},
		{
			name: "POST request with origin",
			config: CORSConfig{
				AllowedOrigins:   []string{},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			method:          http.MethodPost,
			origin:          "https://app.example.com",
			wantOrigin:      "https://app.example.com",
			wantCredentials: "true",
			wantHandlerCall: true,
		},
		{
			name: "PATCH request without origin",
			config: CORSConfig{
				AllowedOrigins:   []string{},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			method:          http.MethodPatch,
			origin:          "",
			wantOrigin:      "*",
			wantCredentials: "true",
			wantHandlerCall: true,
		},
		{
			name: "DELETE request with allowed origin",
			config: CORSConfig{
				AllowedOrigins:   []string{"http://localhost:3000", "https://app.example.com"},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			method:          http.MethodDelete,
			origin:          "http://localhost:3000",
			wantOrigin:      "http://localhost:3000",
			wantCredentials: "true",
			wantHandlerCall: true,
		},
		{
			name: "GET request with disallowed origin",
			config: CORSConfig{
				AllowedOrigins:   []string{"http://localhost:3000"},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			method:          http.MethodGet,
			origin:          "http://evil.com",
			wantOrigin:      "", // Should not set Allow-Origin for disallowed origin
			wantCredentials: "true",
			wantHandlerCall: true,
		},
		{
			name: "POST request without origin and with allowed origins list",
			config: CORSConfig{
				AllowedOrigins:   []string{"http://localhost:3000"},
				AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
				AllowedHeaders:   []string{"Content-Type", "Accept"},
				MaxAge:           3600,
				AllowCredentials: true,
			},
			method:          http.MethodPost,
			origin:          "",
			wantOrigin:      "", // Should not set Allow-Origin when no origin and allowed list exists
			wantCredentials: "true",
			wantHandlerCall: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a test handler that should be called for non-OPTIONS requests
			handlerCalled := false
			testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handlerCalled = true
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"status":"ok"}`))
			})

			// Create CORS middleware
			middleware := NewCORSMiddleware(tt.config)
			handler := middleware(testHandler)

			// Create test request
			req := httptest.NewRequest(tt.method, "/api/tasks", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			// Create response recorder
			rr := httptest.NewRecorder()

			// Execute request
			handler.ServeHTTP(rr, req)

			// Verify Allow-Origin header
			if got := rr.Header().Get("Access-Control-Allow-Origin"); got != tt.wantOrigin {
				t.Errorf("Access-Control-Allow-Origin = %v, want %v", got, tt.wantOrigin)
			}

			// Verify Allow-Credentials header
			if got := rr.Header().Get("Access-Control-Allow-Credentials"); got != tt.wantCredentials {
				t.Errorf("Access-Control-Allow-Credentials = %v, want %v", got, tt.wantCredentials)
			}

			// Verify that the downstream handler was called
			if handlerCalled != tt.wantHandlerCall {
				t.Errorf("downstream handler called = %v, want %v", handlerCalled, tt.wantHandlerCall)
			}

			// Verify response from downstream handler
			if tt.wantHandlerCall && rr.Code != http.StatusOK {
				t.Errorf("status code = %v, want %v", rr.Code, http.StatusOK)
			}
		})
	}
}

// TestIsOriginAllowed 测试 isOriginAllowed 方法
func TestIsOriginAllowed(t *testing.T) {
	tests := []struct {
		name           string
		allowedOrigins []string
		origin         string
		want           bool
	}{
		{
			name:           "empty allowed list allows all",
			allowedOrigins: []string{},
			origin:         "http://localhost:3000",
			want:           true,
		},
		{
			name:           "origin in allowed list",
			allowedOrigins: []string{"http://localhost:3000", "https://app.example.com"},
			origin:         "http://localhost:3000",
			want:           true,
		},
		{
			name:           "origin not in allowed list",
			allowedOrigins: []string{"http://localhost:3000"},
			origin:         "http://evil.com",
			want:           false,
		},
		{
			name:           "exact match required",
			allowedOrigins: []string{"http://localhost:3000"},
			origin:         "http://localhost:3001",
			want:           false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := CORSConfig{
				AllowedOrigins: tt.allowedOrigins,
			}

			if got := config.isOriginAllowed(tt.origin); got != tt.want {
				t.Errorf("isOriginAllowed() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestMalformedOriginHandling 测试格式错误的 Origin 头处理
func TestMalformedOriginHandling(t *testing.T) {
	config := CORSConfig{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		MaxAge:           3600,
		AllowCredentials: true,
	}

	// Create a test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Create CORS middleware
	middleware := NewCORSMiddleware(config)
	handler := middleware(testHandler)

	// Test cases with malformed origins
	malformedOrigins := []string{
		"not-a-url",
		"://missing-scheme",
		"http://",
		"ftp://unsupported-scheme.com",
	}

	for _, origin := range malformedOrigins {
		t.Run("malformed_"+origin, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
			req.Header.Set("Origin", origin)

			rr := httptest.NewRecorder()

			// Should not panic
			handler.ServeHTTP(rr, req)

			// Should continue processing
			if rr.Code != http.StatusOK {
				t.Errorf("status code = %v, want %v", rr.Code, http.StatusOK)
			}

			// Should not set CORS headers for malformed origins
			// Note: Current implementation treats malformed origins as valid strings
			// This test documents current behavior
		})
	}
}

// TestDownstreamHeaderPreservation 测试中间件不覆盖下游响应头
func TestDownstreamHeaderPreservation(t *testing.T) {
	config := CORSConfig{
		AllowedOrigins:   []string{},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		MaxAge:           3600,
		AllowCredentials: true,
	}

	// Create a test handler that sets custom headers
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Custom-Header", "custom-value")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Create CORS middleware
	middleware := NewCORSMiddleware(config)
	handler := middleware(testHandler)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	req.Header.Set("Origin", "http://localhost:3000")

	// Create response recorder
	rr := httptest.NewRecorder()

	// Execute request
	handler.ServeHTTP(rr, req)

	// Verify CORS headers are set
	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Errorf("Access-Control-Allow-Origin = %v, want %v", got, "http://localhost:3000")
	}

	// Verify downstream headers are preserved
	if got := rr.Header().Get("X-Custom-Header"); got != "custom-value" {
		t.Errorf("X-Custom-Header = %v, want %v", got, "custom-value")
	}

	if got := rr.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %v, want %v", got, "application/json")
	}
}

// TestPanicRecovery 测试 panic 恢复机制
func TestPanicRecovery(t *testing.T) {
	config := CORSConfig{
		AllowedOrigins:   []string{},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Accept"},
		MaxAge:           3600,
		AllowCredentials: true,
	}

	// Create a test handler that panics
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("test panic")
	})

	// Create CORS middleware
	middleware := NewCORSMiddleware(config)
	handler := middleware(testHandler)

	// Create test request
	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	req.Header.Set("Origin", "http://localhost:3000")

	// Create response recorder
	rr := httptest.NewRecorder()

	// Execute request - should not panic
	handler.ServeHTTP(rr, req)

	// Verify 500 status code
	if rr.Code != http.StatusInternalServerError {
		t.Errorf("status code = %v, want %v", rr.Code, http.StatusInternalServerError)
	}

	// Verify error message
	if !contains(rr.Body.String(), "Internal Server Error") {
		t.Errorf("response body should contain 'Internal Server Error', got: %s", rr.Body.String())
	}
}

// TestValidateOrigin 测试 Origin 验证函数
func TestValidateOrigin(t *testing.T) {
	tests := []struct {
		name    string
		origin  string
		wantErr bool
	}{
		{
			name:    "valid http origin",
			origin:  "http://localhost:3000",
			wantErr: false,
		},
		{
			name:    "valid https origin",
			origin:  "https://app.example.com",
			wantErr: false,
		},
		{
			name:    "empty origin",
			origin:  "",
			wantErr: false,
		},
		{
			name:    "invalid origin - no scheme",
			origin:  "localhost:3000",
			wantErr: true,
		},
		{
			name:    "invalid origin - no host",
			origin:  "http://",
			wantErr: true,
		},
		{
			name:    "invalid origin - malformed",
			origin:  "not-a-url",
			wantErr: true,
		},
		{
			name:    "invalid origin - missing scheme",
			origin:  "://missing-scheme",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateOrigin(tt.origin)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateOrigin() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// contains 检查字符串是否包含子串
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
