# 调研：折叠题干的参照物

- [Obsidian Callouts 官方文档](https://obsidian.md/help/callouts)：`> [!type] 标题` 语法、图标/标题/嵌套规则——折叠块写作语法的唯一依据。
- [Stripped callouts (Markdown counterpart to HTML <details> tag) — Obsidian 论坛](https://forum.obsidian.md/t/stripped-callouts-markdown-counterpart-to-html-details-tag/106779)：社区实践中 callout 即 `<details>` 的 markdown 等价物；博客管线把特定类型 callout 转成 `<details>`（默认收起）与本博客 rehypeCallout 机制同构。
- [obsidian-plugin-collapsible-details](https://github.com/nickolay-kondratyev/obsidian-plugin-collapsible-details)：反证——默认 Obsidian 不渲染/不便用原生 `<details>`，故写作侧必须走 callout。

结论：fold 类型 callout（`> [!fold] 标题`）→ 构建时转 `<details>/<summary>`，Obsidian 侧原生显示为 callout，双端一致、人类可写。