# site-style

common.css: the one minimal style of the w0ts sites: Claude Voice, Grids for Max for Live, Jank, Optimist, Track
Kommander, VCVRack Holon.ist, Wishes. Each site loads it by URL (https://w0ts.github.io/site-style/common.css) and sets
only its accent.

switcher.js: the project switcher, a caret after the title in the title bar that opens "Switch project" (a search field
and every w0ts project, the current one ticked). The list is https://w0ts.github.io/projects.json (w0ts.github.io repo:
add a project there and on its index.html). Every page of every site loads it with one line in its head:

```html
<script src="https://w0ts.github.io/site-style/switcher.js" defer></script>
```
