Plan

1. Problem
   - The new animated sign-out button is too large for the header context.
   - The current SVG icon (door-with-arrow) is hard to read at the button size shown in the screenshot.

2. Files to change
   - src/styles.css
   - src/components/verbo/TopNav.tsx (only the inline SVG path)

3. Implementation steps
   - Scale all button dimensions down by 30%:
     - Default button size: 45px → 32px.
     - Hover button width: 160px → 112px.
     - Icon size: 17px → 12px.
     - Text font size: 1em → 0.7em.
     - Hover border radius: 40px → 28px.
     - Padding inside the expanded button: 14px → 10px.
     - Box shadow: 2px 2px 10px → 1.5px 1.5px 7px.
   - Keep the existing flex/percentage layout (20% icon area, 80% text area) and the same hover transition, so the behavior stays identical — only smaller and cleaner.
   - Replace the inline SVG path with a simpler, bolder sign-out icon (a filled power-off / logout glyph) that remains recognizable at ~12px.

4. Verification
   - Hover the sign-out button in the preview and confirm it is ~30% smaller and the icon is clearly visible.
   - Confirm the "Sign out" text still renders on a single line without overlapping.
   - Check both the default circular state and the expanded hover state.
