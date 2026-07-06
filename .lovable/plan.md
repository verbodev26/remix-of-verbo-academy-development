## Plan

1. **Replace accidental white page headings**
   - Update headings like `My Students`, `Calendar`, `Live Sessions`, month labels, modal titles, and similar text that currently uses `text-slate-50` on light backgrounds.
   - Use the existing theme token `text-foreground` so the text appears black/readable on light pages.

2. **Keep intentional white text where it belongs**
   - Do not change text inside dark/navy/orange surfaces, badges, avatars, buttons, overlays, or the public landing/privacy dark sections where white text has proper contrast.
   - This avoids breaking areas where white is correct.

3. **Scan the panel pages for the same pattern**
   - Search Admin, Teacher, and Student panel files for `text-slate-50` and remove it when paired with `text-foreground` or used on normal light surfaces.
   - Prioritize fixing the current selected page and the repeated issue across most internal pages.

4. **Verify after changes**
   - Re-scan the code to confirm no accidental `text-slate-50` headings remain in app panels.
   - Check the visible Teacher Students page heading is readable.