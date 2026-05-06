// Phase 8: superseded by <SmartImage>. Kept as a thin re-export so any caller
// that hasn't migrated yet (or future ad-hoc usage) still gets the gradient block.
// Pass `assetId` to opt into real-image rendering when 04 marks it status >= shot.
export { default } from './SmartImage';
