---
name: vercel-react-native-skills
description: Consult focused React Native and Expo guidance for list, motion, layout, rendering, and native integration issues.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# React Native reference

Use `ui` and repository rules for implementation. Read only relevant rules, not the compiled `AGENTS.md` by default.

- Check installed versions, target platform, existing components, and evidence before choosing an optimization.
- Treat library recommendations as candidates, not mandates; preserve approved behavior and assess dependency/maintenance cost.

Focused references:

- Lists: [virtualization](rules/list-performance-virtualize.md), [item cost](rules/list-performance-item-expensive.md), [images](rules/list-performance-images.md).
- Motion/navigation: [GPU properties](rules/animation-gpu-properties.md), [native navigators](rules/navigation-native-navigators.md).
- Layout: [safe areas](rules/ui-safe-area-scroll.md), [measurement](rules/ui-measure-views.md).
- State/rendering: [ownership](rules/state-ground-truth.md), [text](rules/rendering-text-in-text-component.md).
- Native setup: [dependency ownership](rules/monorepo-native-deps-in-app.md), [fonts](rules/fonts-config-plugin.md).
