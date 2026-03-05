# 跨浏览器测试快速清单

## 测试信息
- **日期**: ___________
- **测试人员**: ___________
- **浏览器**: ___________
- **版本**: ___________
- **操作系统**: ___________
- **设备**: ___________

## 快速测试清单

### 基础功能 (10 分钟)
- [ ] 1. 页面正常加载，无控制台错误
- [ ] 2. 任务列表正确显示（或显示空状态）
- [ ] 3. 创建新任务成功
- [ ] 4. 切换任务完成状态成功
- [ ] 5. 删除任务成功
- [ ] 6. 错误处理正常（断开网络测试）

### 响应式设计 (5 分钟)
- [ ] 7. 桌面视图布局正常（≥1024px）
- [ ] 8. 平板视图布局正常（640-1023px）
- [ ] 9. 移动视图布局正常（<640px）
- [ ] 10. 旋转设备后布局正常（移动设备）

### 交互和可访问性 (5 分钟)
- [ ] 11. 键盘导航正常（Tab, Enter, Space, Escape）
- [ ] 12. 焦点指示器清晰可见
- [ ] 13. 悬停效果正常（桌面）
- [ ] 14. 触摸目标足够大（移动设备）
- [ ] 15. 表单验证正常工作

### 性能和视觉 (5 分钟)
- [ ] 16. 页面加载快速（< 2 秒）
- [ ] 17. 交互响应及时（< 100ms）
- [ ] 18. 动画流畅
- [ ] 19. 颜色和样式一致
- [ ] 20. 字体和间距正常

## 发现的问题

### 问题 1
- **描述**: ___________________________________________
- **严重程度**: [ ] 高 [ ] 中 [ ] 低
- **截图**: ___________________________________________

### 问题 2
- **描述**: ___________________________________________
- **严重程度**: [ ] 高 [ ] 中 [ ] 低
- **截图**: ___________________________________________

### 问题 3
- **描述**: ___________________________________________
- **严重程度**: [ ] 高 [ ] 中 [ ] 低
- **截图**: ___________________________________________

## 总体评估
- **通过项**: _____ / 20
- **状态**: [ ] 通过 [ ] 有问题需修复 [ ] 失败
- **备注**: ___________________________________________

---

## 详细测试步骤参考

### 1. 页面加载测试
1. 打开浏览器开发者工具（F12）
2. 访问应用 URL
3. 检查控制台是否有错误
4. 验证页面在 2 秒内加载完成

### 2. 创建任务测试
1. 在标题框输入 "测试任务"
2. 在描述框输入 "这是一个测试任务"
3. 点击"添加"按钮
4. 验证任务出现在列表中
5. 验证表单被清空

### 3. 切换状态测试
1. 点击任务的复选框
2. 验证任务文本有删除线
3. 验证任务移动到已完成区域
4. 再次点击复选框
5. 验证任务恢复正常状态

### 4. 删除任务测试
1. 悬停在任务上（桌面）或直接查看（移动）
2. 点击删除按钮（×）
3. 验证任务从列表中消失
4. 验证显示成功通知

### 5. 错误处理测试
1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 启用 "Offline" 模式
4. 尝试创建任务
5. 验证显示错误消息
6. 禁用 "Offline" 模式

### 6. 响应式测试
1. 打开浏览器开发者工具
2. 切换到设备模拟模式
3. 测试不同屏幕尺寸：
   - 320px (小手机)
   - 375px (iPhone)
   - 768px (平板)
   - 1024px (桌面)
   - 1920px (大屏幕)
4. 验证布局在所有尺寸下正常

### 7. 键盘导航测试
1. 刷新页面
2. 按 Tab 键导航到标题输入框
3. 输入任务标题
4. 按 Tab 键导航到描述输入框
5. 输入任务描述
6. 按 Tab 键导航到提交按钮
7. 按 Enter 键提交
8. 验证任务创建成功
9. 按 Tab 键导航到任务复选框
10. 按 Space 键切换状态
11. 验证状态切换成功

### 8. 性能测试
1. 打开浏览器开发者工具
2. 切换到 Performance/Lighthouse 标签
3. 运行性能审计
4. 验证以下指标：
   - First Contentful Paint < 1.5s
   - Time to Interactive < 2s
   - Total Blocking Time < 300ms
   - Cumulative Layout Shift < 0.1

## 浏览器特定注意事项

### Chrome
- 检查 CSS Grid 和 Flexbox 布局
- 验证 Fetch API 正常工作
- 测试 Service Worker（如实现）

### Firefox
- 检查自定义表单元素样式
- 验证 CSS 变量正确应用
- 测试焦点管理

### Safari
- 检查日期格式化
- 验证 CSS Grid 兼容性
- 测试 iOS 虚拟键盘行为（Mobile Safari）

### Edge
- 验证与 Chrome 的一致性
- 检查 CSS 自定义属性
- 测试触摸事件（触摸屏设备）

### Mobile Safari (iOS)
- 测试虚拟键盘不遮挡输入框
- 验证触摸目标大小（至少 44x44px）
- 测试横屏和竖屏模式
- 检查 100vh 问题

### Chrome Mobile (Android)
- 测试触摸事件
- 验证自动填充行为
- 测试不同屏幕密度
- 检查软键盘行为

## 边界情况测试

### 长文本测试
```
标题: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

描述: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
```

### 特殊字符测试
```
标题: <script>alert('XSS')</script>
标题: Task with "quotes" and 'apostrophes'
标题: Task with & ampersand
标题: 任务 with 中文 characters
标题: Task with emoji 🎉 ✅ 🚀
```

### 空白字符测试
```
标题: [空字符串]
标题: [只有空格]
标题: [只有制表符]
标题: [只有换行符]
```

## 测试完成后

1. [ ] 填写所有清单项
2. [ ] 记录所有发现的问题
3. [ ] 截图重要问题
4. [ ] 将结果报告给团队
5. [ ] 在问题跟踪系统中创建 bug 报告（如需要）
6. [ ] 更新测试文档（如发现新问题）

---

**注意**: 这是一个快速清单，用于日常测试。完整的测试应参考 `docs/CROSS_BROWSER_TESTING.md` 文档。
