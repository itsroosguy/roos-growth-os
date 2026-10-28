# Roos StudioX — Motion Design Engineering Rules

All code generated and modified in this workspace must strictly follow Emil Kowalski's Motion Design Engineering Skill system:

## 1. Skill: emil-design-eng / animate
- Apply precise, snappy animations to all active UI elements, components, transitions, and layout changes.
- Set standard interaction duration between 140ms and 220ms.
- Enforce the high-performance deceleration curve: `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo) for entrances.
- Enforce the physics-based spring curve: `cubic-bezier(0.34, 1.56, 0.64, 1)` for click responses, button presses, and micro-interactions.

## 2. Skill: review-animations / performance-guard
- Zero layout thrashing: Never animate or transition `width`, `height`, `top`, `left`, `margin`, or `padding`.
- Automatically refactor all positional changes to use GPU-accelerated `transform: translate3d()` and `scale()`.
- Force-inject `will-change: transform, opacity;` layers on moving layout nodes to ensure locked 60fps/120fps performance.
- Automatically bundle an accessibility media fallback layer (`@media (prefers-reduced-motion: reduce)`) into every compiled stylesheet.

## 3. Typographic Constraints (Maintained)
- Font: Google Sans only.
- Allowed weights: 400, 500, and 600 (sparingly). Strictly zero bold (> 600 weight).
- Zero italics anywhere.
