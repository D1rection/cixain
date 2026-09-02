# 修复博客 P1 级缺陷

## Goal

修复已确认的筛选页分页缺陷，以及日期跨时区显示与 React 水合稳定性问题。

## Requirements

- TBD

## Acceptance Criteria

- [ ] TBD

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
# 修复博客 P1 级缺陷

## 背景

线上审查确认博客存在两个 P1 级问题：筛选页的分页链接回到首页且页面没有切分页数据；日期由运行环境时区/本地化规则决定，可能出现日期漂移并导致 SSR 与客户端输出不一致。

## 目标

- 修复分类、标签、系列筛选页的分页行为，并保持筛选上下文。
- 统一文章日期的解析与展示，保证不同运行时区显示同一文章日期。
- 消除服务端与客户端使用不同排序规则造成的水合不一致。

## 子任务

- `09-02-filtered-pagination`：筛选页分页
- `09-02-date-hydration`：日期跨时区与水合稳定性

## 验收标准

- 两个子任务分别完成实现、验证、提交并归档。
- 不改动工作区中用户已有的未提交 Obsidian、模板、文章及生成文件。
- 构建通过，且线上已确认的分页回归场景有可重复的本地验证依据。
