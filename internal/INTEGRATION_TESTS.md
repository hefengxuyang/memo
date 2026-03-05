# Integration Tests Documentation

## Overview

The integration tests in `internal/integration_test.go` provide comprehensive end-to-end testing of the Memo App, verifying that all layers (HTTP handlers, service layer, repository layer, and database) work correctly together.

## Test Setup

Each test uses a temporary SQLite database file that is automatically created and cleaned up after the test completes. The `setupTestServer()` helper function:

1. Creates a unique temporary database file (using timestamp to avoid conflicts)
2. Initializes the database with proper schema
3. Sets up the complete application stack (repository → service → handler → router)
4. Returns a test HTTP server and cleanup function
5. Ensures all resources are properly cleaned up after tests

## Test Coverage

### 1. TestIntegration_CreateAndGetTask
**Purpose**: Verify the complete flow of creating and retrieving a task

**Tests**:
- POST /api/tasks creates a task successfully
- Returns HTTP 201 with task data
- GET /api/tasks/{id} retrieves the created task
- Task data matches what was created

### 2. TestIntegration_UpdateTaskStatus
**Purpose**: Verify task status updates work end-to-end

**Tests**:
- Create a task
- PATCH /api/tasks/{id}/status updates the completion status
- Returns HTTP 200 with updated task
- Status change is persisted correctly

### 3. TestIntegration_DeleteTask
**Purpose**: Verify task deletion and proper cleanup

**Tests**:
- Create a task
- DELETE /api/tasks/{id} removes the task
- Returns HTTP 204 (No Content)
- Subsequent GET returns HTTP 404 (Not Found)

### 4. TestIntegration_ListTasks
**Purpose**: Verify listing all tasks works correctly

**Tests**:
- Create multiple tasks
- GET /api/tasks returns all created tasks
- Response contains correct number of tasks
- All task data is complete

### 5. TestIntegration_ErrorHandling
**Purpose**: Verify proper error handling across the stack

**Sub-tests**:
- **empty_title_returns_validation_error**: Empty title returns HTTP 400 with validation error
- **non-existent_task_returns_not_found**: Non-existent task ID returns HTTP 404
- **invalid_JSON_returns_bad_request**: Malformed JSON returns HTTP 400

### 6. TestIntegration_ConcurrentRequests
**Purpose**: Verify the system handles concurrent task creation

**Tests**:
- Creates 5 tasks concurrently
- Verifies at least some requests succeed
- All successful task IDs are unique
- All created tasks appear in the list
- **Note**: SQLite may experience database locking under high concurrency, which is expected behavior

### 7. TestIntegration_ConcurrentUpdates
**Purpose**: Verify the system handles concurrent updates to the same task

**Tests**:
- Creates a single task
- Updates it concurrently from 5 goroutines
- Verifies at least some updates succeed
- Task remains accessible after concurrent updates
- **Note**: SQLite may experience database locking, which is expected behavior

### 8. TestIntegration_DatabasePersistence
**Purpose**: Verify data persists across database connections

**Tests**:
- Creates a task and closes the database
- Reopens the same database file
- Verifies the task still exists
- Confirms data integrity is maintained

### 9. TestIntegration_CompleteWorkflow
**Purpose**: Verify a complete user workflow

**Tests**:
- Create multiple tasks
- List all tasks
- Update one task's status
- Delete another task
- Verify final state is correct

### 10. TestIntegration_TemporaryFileCleanup
**Purpose**: Verify test cleanup works properly

**Tests**:
- Database file exists during test
- Cleanup function removes the database file
- No test artifacts remain after completion

## SQLite Concurrency Behavior

The integration tests properly handle SQLite's concurrency limitations:

- **WAL Mode**: Database is configured with Write-Ahead Logging for better concurrency
- **Busy Timeout**: 5-second timeout configured for locked database scenarios
- **Connection Pool**: Limited to 25 max open connections, 5 idle connections
- **Expected Behavior**: Under high concurrent load, some operations may fail with "database is locked" errors, which is normal for SQLite

The concurrent tests (`TestIntegration_ConcurrentRequests` and `TestIntegration_ConcurrentUpdates`) are designed to:
1. Accept both successful operations (HTTP 200/201) and database lock errors (HTTP 500)
2. Verify that at least some operations succeed
3. Ensure data integrity for successful operations
4. Log expected lock errors for visibility

## Running the Tests

```bash
# Run all integration tests
go test -v ./internal -run TestIntegration

# Run a specific integration test
go test -v ./internal -run TestIntegration_CreateAndGetTask

# Run with race detection
go test -race -v ./internal -run TestIntegration
```

## Requirements Validated

These integration tests validate all requirements from the specification:

- **Requirement 1**: Task creation with validation
- **Requirement 2**: Task deletion
- **Requirement 3**: Task status updates
- **Requirement 4**: Task listing
- **Requirement 5**: Single task retrieval
- **Requirement 6**: Data persistence
- **Requirement 7**: Error handling
- **Requirement 8**: RESTful API interface

## Test Isolation

Each test:
- Uses its own temporary database file
- Runs in isolation from other tests
- Cleans up all resources after completion
- Can be run in any order
- Can be run in parallel (with appropriate concurrency limits)
