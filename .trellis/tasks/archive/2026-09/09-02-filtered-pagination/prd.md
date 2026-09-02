# 修复筛选页分页

## Goal

让分类、标签和系列筛选页正确解析 page 查询参数、切分页数据并保持筛选路径。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
# 修复筛选页分页

## 问题

分类、标签和系列页当前只判断是否需要显示分页，却始终渲染完整筛选结果；分页链接还使用首页根路径，导致 `?page=2` 不能展示下一页内容。

## 需求

- 从当前 URL 解析正整数 `page`，缺失或非法值按第 1 页处理。
- 按现有 `PAGE_SIZE` 对筛选结果切片，只渲染当前页文章。
- 分页链接必须保留当前筛选类型和 slug，且页码状态正确。
- 首页现有分页行为保持不变；空结果和超出范围页码不得崩溃。

## 验收标准

- `/category/Tech?page=2` 只显示该筛选结果的第二页文章，且链接仍指向 `/category/Tech`。
- `/tag/...`、`/series/...` 使用相同规则。
- `npm run build` 通过，代码格式检查无新增问题。
