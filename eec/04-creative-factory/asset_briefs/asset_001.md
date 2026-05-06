# asset_001 — S-Series Pro hero (web, 16:9, EN-US)

| Field | Value |
|---|---|
| SKU | sku_001 (Roborock S-Series Pro) |
| Purpose | hero |
| Channel | web |
| Audiences | audience_001 (pet households), audience_002 (premium home) |
| Format | 16:9 |
| Status | brief |
| Delivered file | _none yet — drop into `public/og/asset_001.{jpg,webp,avif}`_ |

## Subject (alt text source)
Roborock S-Series Pro docked in heated wash station on light hardwood floor, modern living room background.

## Direction
Studio-style 3/4 hero of premium robot vacuum docked in tall multi-function station, navy + warm orange accent palette, cinematic warm lighting, slight depth of field.

## Composition
- 3/4 angle from approx. 30° front-right.
- Robot fully docked; dock unit visible to upper-third of frame for hierarchy.
- Light hardwood (oak / white-oak) floor — no rugs in primary read.
- Soft daylight from camera-left @ ~5500K; subtle bounce fill camera-right.
- Negative space upper-right for hero copy overlay (`copy_006`).

## Brand mandatories
- Palette: brand-primary `#0F1B2D` (navy) + brand-accent `#FF6B35` (orange) — orange visible only on the dock LED ring or status display.
- Background must NOT compete with product silhouette.
- No overt text-on-product; logo legible but not blown out.

## Acceptance criteria
- [ ] 4000×2250 minimum (2× retina at 2000×1125 display).
- [ ] AVIF + WebP delivered; JPEG fallback ≤ 240 KB.
- [ ] Color-managed sRGB; no clipped highlights on dock chrome.
- [ ] Brand approval (sign-off in 04 output: `approved: true` + `status: shot`).

## Production state
- [x] Brief approved by brand
- [ ] Photographer briefed
- [ ] Shoot date locked
- [ ] Raw delivered
- [ ] Retouched
- [ ] Brand sign-off → flip `status` to `approved`

## How to swap live
1. Drop the final file at `public/og/asset_001.jpg` (or .webp/.avif).
2. In `eec/04-creative-factory/output.json`, set `assets[0].status = "shot"` (or higher), `delivered_file_path = "/og/asset_001.jpg"`, `width = 2000`, `height = 1125`.
3. Re-run `npx ajv-cli@5 validate ...` then `pnpm build`. `<SmartImage assetId="asset_001"/>` will now render the real photo automatically; gradient placeholder disappears.
