# Module 03 — Visual System

## 目标
palette / typography / logo brief / imagery style / motion style —— 设计师能直接落地的指令。

## 输入
- 01.competitors[]（视觉避雷源；抓 favicon / hero 主色）
- 03.tone.persona_archetype（影响色彩温度）

## 步骤
### A. Palette
1. 从受众情感语境推主色调温（warm / cool / neutral）
2. 给 primary / secondary / accent / neutrals[≥2]，全部 hex
3. **避雷**：和头部 3 家竞品任一主色 hex ΔE 距离 ≥ 5（粗算 RGB 欧氏距离 ≥ 50）
4. 冲突不可避免 → SKILL.md 交互点 3：报告冲突度让用户拍板

### B. Typography
- display 字体（标题）+ body 字体（正文），二者 pairing
- 偏向开源 (Google Fonts) 以减少授权成本
- 给 pairing rationale（contrast / harmony 解释）

### C. Logo Brief
- `mark_concept`: 设计师能直接落地的指令（"两条交叠的水波线，象征流体与稳态平衡"），不是抽象形容
- `wordmark_treatment`: lowercase / uppercase / 字距 / 简化标识
- `motif`: 可重复使用的辅助图形元素

### D. Imagery Style
- `mood`: 摄影 / 插画 / 3D / 拼贴 / 极简
- `lighting`: hard / soft / golden hour / studio
- `do[]` / `dont[]`: 5 条以内
- `references[]`: pinterest / behance URL（≥ 3）

### E. Motion Style (轻量)
- `easing`: ease-out / spring / linear
- `duration_ms_band`: 150-250
- `usage`: hover / page-transition / scroll-reveal

## 并行
- A + B + C + D 四块并行起草

## 输出
```jsonc
"visual_system": {
  "palette": {
    "primary": "#1a3a5c",
    "secondary": "#f5e6c8",
    "accent": "#d94f4f",
    "neutrals": ["#0a0a0a", "#f7f7f5"]
  },
  "typography": {
    "display": "Fraunces",
    "body": "Inter",
    "pairing_rationale": "..."
  },
  "logo_brief": {
    "mark_concept": "...",
    "wordmark_treatment": "lowercase, tight tracking",
    "motif": "..."
  },
  "imagery_style": { ... },
  "motion_style": { ... }
}
```

## 校验
- palette 全部 hex 合法 `^#[0-9A-Fa-f]{6}$`
- 主色与头部 3 家竞品冲突度 < 阈值
- typography.display ≠ typography.body
