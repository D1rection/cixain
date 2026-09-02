# 修复日期跨时区与水合不一致

## Goal

统一日期解析与展示，避免跨时区日期漂移，并消除 SSR/客户端排序造成的水合不一致。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
# 修复日期跨时区与水合不一致

## 问题

文章日期来自日期型 frontmatter 并序列化为 UTC 零点 ISO 字符串。组件使用 `Date` 的本地时区格式化，用户可能看到前一天；服务端与客户端的本地化输出也可能不同。侧栏标签排序使用 `localeCompare`，不同运行时 locale 可能产生不同 DOM 顺序。

## 需求

- 以文章 frontmatter 的日历日期为准，跨时区显示不漂移。
- 统一文章卡片、文章页、文章结尾和归档页的日期格式，不改变现有视觉语义。
- 对 SSR/客户端共享的标签排序使用确定性、locale-independent 的比较规则。
- 不引入客户端挂载后才显示日期的闪烁或 SEO 内容缺失。

## 验收标准

- 在 UTC、Asia/Shanghai 和 America/Los_Angeles 环境下，同一文章显示同一日期。
- 归档分组日期与卡片/文章页日期一致。
- 生产构建通过；水合相关输出不再因日期或标签排序产生不一致。
