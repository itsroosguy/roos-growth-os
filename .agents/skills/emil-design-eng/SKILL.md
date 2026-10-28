---
name: emil-design-eng
description: >-
  Apply Emil Kowalski's Motion Design Engineering principles to all interactive UI components,
  transitions, and layout changes. Enforces 140ms-220ms durations, easeOutExpo (cubic-bezier(0.16, 1, 0.3, 1))
  for entrances, and spring (cubic-bezier(0.34, 1.56, 0.64, 1)) for click responses and micro-interactions.
---

# Emil Kowalski Motion Design Engineering System

This skill defines the motion engineering design tokens, curve specifications, and performance rules to achieve snappy, physics-based, fluid digital product interactions.

## 1. Timing Curves & Physics

### Entrance Curve (easeOutExpo / High-Performance Deceleration)
```css
cubic-bezier(0.16, 1, 0.3, 1)
```
- **When to use**: Dialog entrances, dropdown menus, toast notifications, drawer slides, view changes, tab cross-fades, and page reveals.
- **Why**: Objects enter the viewport quickly to capture attention and gently decelerate to rest, eliminating perceptible lag while feeling grounded.

### Interaction / Spring Curve (Physics-Based Snap)
```css
cubic-bezier(0.34, 1.56, 0.64, 1)
```
- **When to use**: Button clicks, toggle switches, icon micro-interactions, badge bumps, bookmark / star animations, and selection states.
- **Why**: Provides tactile, physical feedback by slightly overshooting before settling, making interactive elements feel responsive and tangible.

## 2. Interaction Durations (140ms – 220ms)

| Interaction Type | Target Duration | Curve | Purpose |
| :--- | :--- | :--- | :--- |
| **Tap / Press Response** | `140ms` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Immediate tactile confirmation on `:active` |
| **Hover State / Icon Tilt**| `160ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Crisp pointer feedback without sticky latency |
| **Component Entrance / Exit**| `180ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Swift entrance of modals, dropdowns, and tooltips |
| **Drawer / Panel Slide** | `220ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Controlled physical glide across larger screen distances |

## 3. Implementation Rules

1. **GPU Acceleration Only**: Always use `transform: translate3d(x, y, 0)` and `transform: scale()`. Never animate layout-triggering properties (`width`, `height`, `top`, `left`, `margin`, `padding`).
2. **Compositor Layers**: Add `will-change: transform, opacity;` during active transitions to prevent main-thread jank.
3. **Accessibility**: Every animation and transition must respect `@media (prefers-reduced-motion: reduce)`.
