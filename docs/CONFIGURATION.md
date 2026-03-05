# 配置管理

Memo 支持通过环境变量或配置文件进行配置。配置优先级为：**环境变量 > 配置文件 > 默认值**

## 配置选项

### 数据库配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| 数据库路径 | `DB_PATH` | `memo.db` | SQLite 数据库文件路径 |

### 服务器配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| 服务端口 | `PORT` | `8080` | HTTP 服务器监听端口 |
| 读取超时 | `READ_TIMEOUT` | `15` | HTTP 请求读取超时时间（秒） |
| 写入超时 | `WRITE_TIMEOUT` | `15` | HTTP 响应写入超时时间（秒） |
| 空闲超时 | `IDLE_TIMEOUT` | `60` | HTTP 连接空闲超时时间（秒） |

## 使用方法

### 1. 使用默认配置

直接运行程序，将使用所有默认值：

```bash
./memo
```

### 2. 使用环境变量

通过环境变量覆盖默认配置：

```bash
# 设置数据库路径和端口
export DB_PATH=/data/memo.db
export PORT=9090

# 运行程序
./memo
```

或者在运行时指定：

```bash
DB_PATH=/data/memo.db PORT=9090 ./memo
```

### 3. 使用配置文件

创建 JSON 格式的配置文件（参考 `config.example.json`）：

```json
{
  "database": {
    "path": "/custom/path/memo.db"
  },
  "server": {
    "port": "3000",
    "read_timeout": 30,
    "write_timeout": 30,
    "idle_timeout": 120
  }
}
```

通过 `CONFIG_FILE` 环境变量指定配置文件路径：

```bash
CONFIG_FILE=./config.json ./memo
```

### 4. 组合使用

配置文件和环境变量可以组合使用，环境变量会覆盖配置文件中的值：

```bash
# 使用配置文件，但通过环境变量覆盖端口
CONFIG_FILE=./config.json PORT=7000 ./memo
```

## 配置示例

### 开发环境

```bash
# 使用内存数据库，快速启动
DB_PATH=:memory: PORT=8080 ./memo
```

### 生产环境

创建 `production.json`：

```json
{
  "database": {
    "path": "/var/lib/memo/memo.db"
  },
  "server": {
    "port": "80",
    "read_timeout": 30,
    "write_timeout": 30,
    "idle_timeout": 120
  }
}
```

运行：

```bash
CONFIG_FILE=./production.json ./memo
```

### Docker 环境

在 Docker 容器中使用环境变量：

```bash
docker run -e DB_PATH=/data/memo.db -e PORT=8080 -v /host/data:/data memo
```

## 配置验证

程序启动时会输出当前使用的配置：

```
2024/01/01 12:00:00 Initializing database connection: /data/memo.db
2024/01/01 12:00:00 Database initialized successfully
2024/01/01 12:00:00 Starting HTTP server on port 9090
2024/01/01 12:00:00 Server started successfully
```

## 注意事项

1. **数据库路径**：确保程序对数据库文件所在目录有读写权限
2. **端口号**：确保指定的端口未被占用，且程序有权限监听该端口（1024 以下的端口需要 root 权限）
3. **超时配置**：超时值必须为正整数，无效值将被忽略并使用默认值
4. **配置文件格式**：配置文件必须是有效的 JSON 格式，否则程序启动失败
