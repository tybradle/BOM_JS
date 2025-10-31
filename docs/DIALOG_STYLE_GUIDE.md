## Dialog & Popup Sizing Guide

A short, practical guide for developers who need to change the size or layout of modal dialogs / popups in the BOM_JS app.

### Quick overview
- Per-dialog sizing is controlled where `DialogContent` is used (e.g. `src/components/LandingPage.tsx`).
- The app uses a shared wrapper component for dialogs: `src/components/ui/dialog.tsx`. Its base classes can impose defaults.
- Tailwind responsive classes (e.g. `sm:`, `md:`) can override plain classes; use matching responsive overrides or Tailwind's `!` modifier to force overrides.

### Files to inspect or edit

- `src/components/ui/dialog.tsx` — base dialog wrapper. Look for the `DialogPrimitive.Content` `className` string. If you want a different default max-width/height for all dialogs, change or remove the responsive max-width here.

- Any component that opens a dialog — e.g. `src/components/LandingPage.tsx` — will render `<DialogContent className="...">` (or pass className through the `Dialog` wrapper). Modify that `className` to control size for that instance.

### Common Tailwind classes to use
- Width examples:
  - `max-w-md`, `max-w-lg`, `max-w-2xl`, `max-w-6xl` — Tailwind presets
  - `max-w-[95vw]` — viewport percentage (near full width)
- Height examples:
  - `max-h-[85vh]`, `max-h-[95vh]` — percentage of viewport height
  - `h-[80vh]` — explicit height
- Scrolling inside dialog:
  - Add `overflow-y-auto` to enable vertical scrolling when content exceeds dialog height.

### Responsive behavior and specificity
- If the base dialog includes `sm:max-w-lg` (or similar), it applies at small screens and up and can override your non-responsive `max-w-...`.
- To ensure your size applies across breakpoints, use a responsive override: `sm:max-w-[95vw] md:max-w-[95vw]` or force it with `!max-w-[95vw]` (use sparingly).

### Nested dialogs
- A dialog can contain another `Dialog` (for example, 'Create New Project' inside the Project Manager). Each `DialogContent` may need its own className to size it appropriately.

### Recommended approach
1. Prefer setting sizes per-dialog where used. This keeps the base component generic. Example:

```tsx
<DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
  ...
</DialogContent>
```

2. If many dialogs should share a new default, change `src/components/ui/dialog.tsx` by editing the `className` passed to `DialogPrimitive.Content` (remove `sm:max-w-lg` if present).

3. Avoid `!important` (`!` prefix) unless you cannot change the base component. Use `!` only as a last resort.

### Testing & workflow
- UI/CSS changes do NOT usually require restarting the server in dev — HMR and a browser refresh are sufficient. If you change `server.ts`, `next.config.ts`, Tailwind config, or similar, restart dev server.
- To restart dev server (Windows `cmd`):
```cmd
npm run dev
```

### Git workflow suggestion
- Make small commits with clear messages. Example:
```
git add src/components/ui/dialog.tsx src/components/LandingPage.tsx
git commit -m "dialog(ui): remove base sm:max-w-lg and make Project Manager configurable"
```

### Troubleshooting
- If your dialog still looks small:
  1. Inspect the element in browser devtools and check which Tailwind classes are applied.
  2. Look for `sm:max-w-...` or other responsive classes coming from `src/components/ui/dialog.tsx`.
  3. If necessary, add an explicit responsive override in the component using the dialog.

If you want, I can add a short code example directly to `LandingPage.tsx` that shows both the Project Manager and the Create Project dialog with recommended sizes.

---
Last updated: October 29, 2025
