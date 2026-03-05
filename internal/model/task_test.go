package model

import (
	"strings"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// **Validates: Requirements 2.4, 2.5, 2.6, 2.7**
// Feature: task-list-and-update, Property 6: 输入验证规则
//
// 对于任何输入,验证函数应该:
// - 拒绝空字符串或仅包含空白字符的标题
// - 拒绝长度超过200字符的标题
// - 拒绝长度超过1000字符的描述
// - 接受符合上述规则的有效输入
func TestProperty_UpdateTaskRequestValidation(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100 // 最少 100 次迭代
	properties := gopter.NewProperties(parameters)

	// 属性 1: 空字符串或仅包含空白字符的标题应该被拒绝
	properties.Property("empty or whitespace-only titles are rejected",
		prop.ForAll(
			func(whitespace string) bool {
				req := &UpdateTaskRequest{
					Title:       whitespace,
					Description: "valid description",
				}
				err := req.Validate()
				// 应该返回验证错误
				if err == nil {
					return false
				}
				// 错误应该是 ValidationError 类型
				validationErr, ok := err.(*ValidationError)
				if !ok {
					return false
				}
				// 错误字段应该是 "title"
				return validationErr.Field == "title"
			},
			// 生成空字符串或仅包含空白字符的字符串
			gen.OneConstOf("", " ", "  ", "\t", "\n", "   \t\n   "),
		),
	)

	// 属性 2: 长度超过200字符的标题应该被拒绝
	properties.Property("titles exceeding 200 characters are rejected",
		prop.ForAll(
			func(extraChars string) bool {
				// 创建一个基础的201字符标题
				baseTitle := strings.Repeat("a", 201)
				req := &UpdateTaskRequest{
					Title:       baseTitle + extraChars,
					Description: "valid description",
				}
				err := req.Validate()
				// 应该返回验证错误
				if err == nil {
					return false
				}
				// 错误应该是 ValidationError 类型
				validationErr, ok := err.(*ValidationError)
				if !ok {
					return false
				}
				// 错误字段应该是 "title"
				return validationErr.Field == "title"
			},
			// 生成额外的字符串（0-100个字符）
			gen.AnyString(),
		),
	)

	// 属性 3: 长度超过1000字符的描述应该被拒绝
	properties.Property("descriptions exceeding 1000 characters are rejected",
		prop.ForAll(
			func(extraChars string) bool {
				// 创建一个基础的1001字符描述
				baseDesc := strings.Repeat("a", 1001)
				req := &UpdateTaskRequest{
					Title:       "valid title",
					Description: baseDesc + extraChars,
				}
				err := req.Validate()
				// 应该返回验证错误
				if err == nil {
					return false
				}
				// 错误应该是 ValidationError 类型
				validationErr, ok := err.(*ValidationError)
				if !ok {
					return false
				}
				// 错误字段应该是 "description"
				return validationErr.Field == "description"
			},
			// 生成额外的字符串（0-100个字符）
			gen.AnyString(),
		),
	)

	// 属性 4: 符合规则的有效输入应该被接受
	properties.Property("valid inputs are accepted",
		prop.ForAll(
			func(titleLen int, descLen int) bool {
				// 生成有效长度的标题和描述
				title := strings.Repeat("a", titleLen)
				description := strings.Repeat("b", descLen)

				req := &UpdateTaskRequest{
					Title:       title,
					Description: description,
				}
				err := req.Validate()
				// 不应该返回错误
				return err == nil
			},
			// 生成 1-200 之间的标题长度
			gen.IntRange(1, 200),
			// 生成 0-1000 之间的描述长度
			gen.IntRange(0, 1000),
		),
	)

	// 属性 5: 标题前后有空白字符但去除后有效的输入应该被接受
	properties.Property("titles with leading/trailing whitespace are accepted if trimmed length is valid",
		prop.ForAll(
			func(titleLen int, leadingSpaces int, trailingSpaces int) bool {
				// 生成有效长度的标题内容
				titleContent := strings.Repeat("a", titleLen)
				// 添加前后空白字符
				title := strings.Repeat(" ", leadingSpaces) + titleContent + strings.Repeat(" ", trailingSpaces)

				req := &UpdateTaskRequest{
					Title:       title,
					Description: "valid description",
				}
				err := req.Validate()
				// 不应该返回错误
				return err == nil
			},
			// 生成 1-200 之间的标题内容长度
			gen.IntRange(1, 200),
			// 生成 0-10 之间的前导空格数
			gen.IntRange(0, 10),
			// 生成 0-10 之间的尾随空格数
			gen.IntRange(0, 10),
		),
	)

	// 属性 6: 边界值测试 - 正好200字符的标题应该被接受
	properties.Property("title with exactly 200 characters is accepted",
		prop.ForAll(
			func() bool {
				title := strings.Repeat("a", 200)
				req := &UpdateTaskRequest{
					Title:       title,
					Description: "valid description",
				}
				err := req.Validate()
				return err == nil
			},
		),
	)

	// 属性 7: 边界值测试 - 正好1000字符的描述应该被接受
	properties.Property("description with exactly 1000 characters is accepted",
		prop.ForAll(
			func() bool {
				description := strings.Repeat("a", 1000)
				req := &UpdateTaskRequest{
					Title:       "valid title",
					Description: description,
				}
				err := req.Validate()
				return err == nil
			},
		),
	)

	// 属性 8: 空描述应该被接受
	properties.Property("empty description is accepted",
		prop.ForAll(
			func(titleLen int) bool {
				title := strings.Repeat("a", titleLen)
				req := &UpdateTaskRequest{
					Title:       title,
					Description: "",
				}
				err := req.Validate()
				return err == nil
			},
			// 生成 1-200 之间的标题长度
			gen.IntRange(1, 200),
		),
	)

	properties.TestingRun(t)
}
