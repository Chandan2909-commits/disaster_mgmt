# CrossTech POS - Design System & Style Guide

This document comprehensively outlines the design philosophy, aesthetic principles, layout rules, and specific style tokens used in the CrossTech POS application. It is designed to act as a definitive prompt or reference guide for any Agentic AI to replicate this exact styling and user experience in other projects.

## 1. Design Philosophy
The application follows a **Modern Premium** aesthetic. It feels alive, tactile, and frictionless.
- **Micro-Interactions**: Buttons press in when clicked (`active:scale-95`). Transitions are smooth and ubiquitous (`transition-all`, `transition-colors`, `transition-transform`).
- **Soft Geometry**: Sharp edges are strictly avoided. Almost all interactive elements, cards, and containers feature generous border radii (`rounded-2xl`, `rounded-3xl`, `rounded-full`).
- **Clean Layouts**: The UI is uncrowded, utilizing whitespace heavily. Containers avoid harsh borders, opting instead for soft backgrounds and subtle shadows.
- **Glassmorphism & Depth**: Modals and overlays use blurred backdrops (`backdrop-blur-sm` with `bg-black/60`). 

## 2. Typography
- **Primary Font Family**: 'Montserrat', sans-serif
- **Headings**:
  - Weight: Extra Bold (`font-extrabold`)
  - Tracking: Tight (`tracking-tight`)
  - Color: `text-gray-900` (Light Mode) / `text-white` (Dark Mode)
  - Sizes: Very large for impact. E.g., App Titles use `text-3xl` to `text-6xl`, Page Headers use `text-xl` to `text-[42px]`.
- **Body & Subtitles**:
  - Weight: Bold (`font-bold`) or Semibold (`font-semibold`)
  - Color: `text-gray-800` (Main), `text-gray-500` or `text-gray-400` (Muted/Subtitles).

## 3. Color Palette
**Premium Core Colors:**
- **Background (App):** Off-white `#f8f9fa` (Light) / `#121212` (Dark)
- **Background (Cards/Inputs):** White `bg-white` / `#f4f5f7` (Light) / `#1e1e1e` (Dark)
- **Primary Accent / Brand (Buttons/Active Tabs):** `#1e1e1e` (Almost Black)
- **Secondary Accent (Highlights / Form Focus):** `#10b981` (Emerald Green)
- **Tertiary Accent (Alerts / Map Pins):** `#f43f5e` (Rose Red)
- **Text (Light Mode):** `text-gray-900` (Primary), `text-gray-800` (Secondary), `text-gray-500` & `text-gray-400` (Muted).
- **Text (Dark Mode):** `text-white` (Primary), `text-gray-200` (Secondary), `text-gray-400` (Muted).

## 4. Components & Shapes

### 4.1 Buttons
- **Primary Action Buttons** (e.g., Login, Add to Cart):
  - Styles: `bg-[#1e1e1e] text-white font-bold py-4 rounded-2xl shadow-md`
  - Interactions: `active:scale-95 transition-transform`
- **Secondary / Toggle Buttons** (e.g., Category Pills):
  - Inactive: `bg-white text-gray-500 border border-transparent`
  - Active: `bg-[#1e1e1e] text-white border border-[#1e1e1e]`
  - Shape: `rounded-full px-6 py-2.5`
- **Icon Buttons** (e.g., Settings, Menu):
  - Styles: `p-2 rounded-full active:bg-gray-200 transition-colors`

### 4.2 Inputs & Forms
- **Text Inputs**:
  - Background: `bg-[#f4f5f7]`
  - Borders: `border-transparent rounded-2xl`
  - Text: `font-semibold text-gray-800 placeholder-gray-400`
  - Focus State (Crucial): `focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all`
- **Checkboxes**:
  - Styles: `rounded text-[#10b981] focus:ring-[#10b981] accent-[#10b981]`

### 4.3 Cards (e.g., Product Grid)
- Background: `bg-white`
- Border: `border border-gray-100` (very subtle)
- Shape: `rounded-3xl p-4`
- Shadow: `shadow-sm`
- Image Container inside Card: `bg-gray-50 rounded-2xl`

### 4.4 Navigation (Bottom Bar)
- Placement: `absolute bottom-0 left-0 w-full z-40`
- Shape: `rounded-t-3xl`
- Shadow: Custom inverted shadow `shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]`
- Active State: Icon container gets `bg-[#1e1e1e] p-2 rounded-2xl`, text changes from `text-gray-400` to `text-[#1e1e1e]`.

### 4.5 Modals & Dialogs
- **Backdrop**: `fixed inset-0 bg-black/60 backdrop-blur-sm`
- **Container**: `bg-white rounded-[32px] p-6 shadow-2xl`
- **Animation**: Custom `@keyframes slideUp` applied via `animate-slide-up` (0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards).

## 5. Layout & Spacing Rules
- **Container Structure**: The app utilizes `100dvh` to ensure perfect fit on mobile screens, with `overflow: hidden` on the root.
- **Scrollable Areas**: Uses a custom `.scrollable-content` class that hides scrollbars (`::-webkit-scrollbar { display: none; }`) while allowing flex-grow.
- **Padding**: 
  - Standard horizontal padding for pages is `px-4`.
  - Scrollable content requires substantial bottom padding (e.g., `padding-bottom: 96px`) to prevent content from being hidden behind the absolute bottom navigation bar.

## 6. Icons
- **Library**: Heroicons outline (`@heroicons/react/24/outline`).
- **Sizing**: Typically `w-5 h-5` or `w-6 h-6`.
- **Stroke Width**: Standard outline stroke.

## 7. How to Apply This to a New Project (AI Prompt Instructions)
When an AI is instructed to use this document for styling a new project, it should:
1. Wrap the app in a container with `bg-[#f8f9fa]`, `h-[100dvh]`, `overflow-hidden`.
2. Apply the 'Montserrat' font globally.
3. Use the defined color hex codes for all background and text elements.
4. Ensure every button has `active:scale-95 transition-all`.
5. Ensure every input has the `#10b981` (emerald) focus ring.
6. Use extreme border radii (`rounded-2xl`, `rounded-3xl`, `rounded-full`) instead of standard corners.
7. Hide native scrollbars on scrollable containers while retaining scroll functionality.
8. Use backdrop blurs for any overlays.
