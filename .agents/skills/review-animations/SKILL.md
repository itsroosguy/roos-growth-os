---
name: review-animations
description: >-
  Performance guard against layout thrashing and animation jank. Scans code files for transitions
  on width, height, top, left, margin, padding; refactors them to GPU-accelerated translate3d() and scale();
  injects will-change: transform, opacity; and asserts prefers-reduced-motion accessibility coverage.
---

# Animation Performance Guard (Emil Kowalski Review Matrix)

This skill serves as the automated and manual quality gate to ensure locked 60fps/120fps motion design performance across all browsers and devices.

## 1. Zero Layout Thrashing Rule

CSS layout properties trigger expensive reflows (Recalculate Style -> Layout -> Paint -> Composite). Under no circumstances should these properties be transitioned or animated:

| Forbidden (Causes Reflow) | Required GPU Replacement |
| :--- | :--- |
| `top: 10px;` / `left: 20px;` | `transform: translate3d(20px, 10px, 0);` |
| `margin-top: -4px;` | `transform: translate3d(0, -4px, 0);` |
| `width: 240px;` | Container sizing via static flex/grid or clip-path / scale |
| `height: 0 -> auto;` | `transform: scaleY()` or discrete opacity / CSS grid rows |
| `padding: 12px;` | Fixed padding with inner container translate |

## 2. Compositor Promotion (`will-change`)

Moving layout nodes must be promoted to independent GPU compositor layers during motion:
```css
will-change: transform, opacity;
```
*Note: Do not leave `will-change` globally on hundreds of passive elements to avoid excessive VRAM consumption. Apply on active interactive classes and animated surfaces.*

## 3. Accessibility Media Fallback Layer

Every compiled stylesheet must contain universal reduced motion protection:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
    transform: none !important;
  }
}
```

## 4. Verification Check

Run `node scripts/review-animations.js` to assert that zero layout-thrashing transition properties exist in the codebase.
