# 文章底部模块 — 执行计划

## 步骤

1. **新建 `src/components/PostEnd.jsx`**
   - `useMemo` 计算 prev/next 和 related（按 design.md 算法）
   - 渲染三个区块，无数据区块整体跳过
   - 验证：`node -e` 或 dev server 检查组件无报错

2. **新建 `src/components/PostEnd.module.css`**
   - 容器、PrevNext、RelatedCards、Copyright 样式（硬阴影设计语言）
   - 移动端自适应
   - 验证：浏览器检查布局

3. **修改 `src/pages/BlogPost.jsx`**
   - import PostEnd，在 contentRef div 之后渲染
   - 验证：文章页底部出现模块

4. **修改 `src/components/PostContent.module.css`**
   - `padding: 24px 0 70vh` → `padding: 24px 0 0`
   - 验证：留白消失，模块紧接正文

5. **手动验收**（对照 prd.md Acceptance Criteria）
   - 打开有共同 tag 的文章 → 相关推荐出现且正确
   - 打开无 tag 或独有 tag 的文章 → 相关推荐模块隐藏
   - 首篇/末篇文章 → 单侧导航
   - 深浅色主题、移动端宽度检查

6. **提交**
   - Angular 规范 commit（如 `feat: 文章底部添加相关推荐与导航`）

## Review Gates

- PRD 确认后 `task.py start` 才动工
- 每步验证后进入下一步
- 全部完成后由用户本地查看效果再 push

## Rollback

- 删除 PostEnd 两文件 + 还原 BlogPost.jsx / PostContent.module.css 两处改动即可完全回退
