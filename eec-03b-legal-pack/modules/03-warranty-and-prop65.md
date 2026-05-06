# Module 3: 产品类条款 (Warranty + Prop 65)

## Warranty per-SKU

### 字段

| 字段 | 来源 | 默认 |
|---|---|---|
| sku_id | 02.skus[].id | required |
| duration_months | 02.skus[].warranty_months | required, ≥1 |
| covers[] | 02.skus[].covers? + 通用 (manufacturing defects, motor failure) | required ≥1 |
| excludes[] | 通用 (accidental damage, consumables, normal wear) + 02.skus[].excludes? | required ≥1 |
| transferable | 02.skus[].warranty_transferable | default false |

### 默认 covers / excludes 模板

**covers (通用)**：
- Manufacturing defects (parts and labor)
- Motor / drive train failure
- Battery capacity below 70% within warranty period (li-ion only)

**excludes (通用)**：
- Accidental physical damage
- Water damage outside designed use
- Consumables (brushes, filters, mop pads)
- Damage from non-OEM parts or unauthorized service
- Normal wear and tear

类目相关附加（机器人吸尘器）：
- excludes 加 "lidar/camera lens scratch from misuse"
- covers 加 "navigation sensor failure"

### claim_process（≤800 字）

模板：
```
1. Email <claim_contact_email> with: order #, SKU, photo of defect, brief description
2. We respond within 3 business days with a Return Merchandise Authorization (RMA) #
3. Ship the unit (we email a prepaid label)
4. We inspect within 5 business days of receipt
5. If covered: replacement unit or refund (your choice) ships within 7 business days
6. If not covered: we email you with explanation + repair quote (optional)
```

## Prop 65 (California 65)

### 触发判定

02.skus[] 任一满足以下 → 写入 applies_to_sku_ids[]：
- materials 含 "lithium-ion" / "li-ion" battery
- materials 含 "lead" / "cadmium" / "phthalate" / "BPA"
- 电源适配器（DEHP / phthalate 风险）

无触发 → `chemical_list: []` + `body_md: "Based on current product catalog and CA Office of Environmental Health Hazard Assessment guidance, no Proposition 65 warning is required for any product currently sold. We re-evaluate annually."`

### 触发时 body_md（≥200 字）

```
WARNING: This product can expose you to chemicals including [chemical], which is known to the State of California to cause cancer and birth defects or other reproductive harm. For more information go to www.P65Warnings.ca.gov.

Specifically: <chemical> is present in <component> due to <reason>. Exposure route: <route> (e.g., inhalation, skin contact). Estimated exposure level: <below|at|above> the No Significant Risk Level (NSRL).

Affected SKUs: <list>
```

### chemical_list[] 字段

```jsonc
{ "chemical": "Di(2-ethylhexyl) phthalate (DEHP)", "exposure_route": "skin contact via charging cable" }
```

## 并行

每个 SKU warranty body 并行写。Prop 65 串行（先扫全部 SKU 决定触发集，再写 body_md）。

## 输出

```jsonc
"warranty_terms": { "per_sku": [...], "claim_process": "...", "body_md": "..." },
"prop65_warning"?: { "applies_to_sku_ids": [...], "chemical_list": [...], "body_md": "..." }
```
