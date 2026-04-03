# OmniFlow Ledger: Soul & Concept

This document outlines the design philosophy, aesthetic principles, and technical implementation details of the OmniFlow Ledger application. It serves as a guide for maintaining visual and functional consistency in future iterations.

## 1. Core Philosophy: "The Digital Glass"
The app is designed to feel like a high-end, tactile piece of hardware—specifically inspired by the **Apple ecosystem (iOS/macOS)**. It prioritizes clarity, depth, and a "soft-premium" aesthetic.

### Key Principles:
- **Architectural Honesty**: No fake textures. Depth is achieved through transparency and light, not heavy gradients.
- **Intentional Spacing**: Generous padding (`p-8`, `px-8 py-6`) creates a sense of luxury and prevents the interface from feeling cluttered.
- **Micro-Interactions**: Every action should feel responsive. Buttons scale down on click, and panels fade in smoothly.

---

## 2. Visual Identity

### Color Palette (The iOS Spectrum)
We use a refined set of colors that are vibrant yet professional:
- **Background (`ios-bg`)**: `#F2F2F7` (A soft, off-white gray).
- **Primary (`ios-blue`)**: `#007AFF` (The signature iOS blue).
- **Success (`ios-green`)**: `#34C759`.
- **Warning (`ios-orange`)**: `#FF9500`.
- **Danger (`ios-red`)**: `#FF3B30`.
- **Secondary (`ios-gray`)**: `#8E8E93`.

### Typography
- **Primary Font**: `-apple-system`, `SF Pro Display`, `Inter`.
- **Headings**: `font-bold tracking-tight text-black`.
- **Data/Labels**: `font-semibold text-[14px]` for clarity.
- **Notes/Subtext**: `italic text-gray-500 text-[12px]`.

---

## 3. UI Components & Styling

### The Glass Panel (`.glass-panel`)
The cornerstone of the UI. It uses high-level transparency and blur to create depth.
```css
.glass-panel {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  border-radius: 32px; /* Large, soft corners */
}
```

### Buttons & Inputs
- **`ios-button`**: Solid background, bold text, `active:scale-95` for tactile feedback.
- **`ios-input`**: Subtle `bg-black/5`, transitions to white with a blue ring on focus.
- **Badges**: Low-opacity backgrounds (e.g., `bg-blue-500/10`) with high-contrast text for status indicators.

---

## 4. Animation & Motion
We use `motion/react` (Framer Motion) and Tailwind's `animate-in` for a fluid experience.
- **Entrances**: `animate-in fade-in slide-in-from-bottom-4 duration-500`.
- **Transitions**: `transition-all duration-300 ease-out`.
- **Feedback**: `active:scale-95` on all interactive elements.

---

## 5. Layout Strategy
- **Desktop-First Precision**: The app uses a structured grid (`lg:col-span-12`) but maintains a centered, focused container (`max-w-7xl mx-auto`).
- **Table Design**: Sticky headers (`sticky top-0 z-20`), subtle row highlights (`hover:bg-black/[0.02]`), and custom thin scrollbars.
- **Responsive Density**: On mobile, we prioritize vertical stacking while maintaining the large border radii and glass effects.

---

## 6. Developer Notes for Future AI
- **Tailwind First**: Do not use inline styles. Use the custom theme variables defined in `index.css`.
- **Iconography**: Use `lucide-react`. Keep icons small (`w-4 h-4` or `w-5 h-5`) and consistent in stroke weight.
- **Consistency**: Always use `rounded-[32px]` for main panels and `rounded-xl` for smaller elements like buttons or inputs.
- **The "Vibe" Check**: If a component feels "boxy" or "flat," add a backdrop blur, increase the border radius, and soften the shadow.

---
*Created with care to ensure the OmniFlow Ledger remains a beautiful, functional tool.*
