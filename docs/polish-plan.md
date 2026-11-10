# Site polish plan: more realistic, more professional

Reviewed at commit 464f05e (branch `fix-blurry-walk`), from the code, the build output and headless-Chrome screenshots of all six chapters, the lower page and four mobile views.

## What the screenshots show

The character is a realistic, motion-captured person. The world he walks through is not, and that mismatch is what reads as "not real":

1. **No visible sun shadows on the ground in any chapter.** The sun sits 5 to 12 degrees above the horizon in every daytime chapter (`sunY` 2.6 to 6.5 over a 32 m horizontal offset) and behind the sets (`z = -18`). Flat ground gets about a fifth of the sun's light and almost all of its brightness from the hemisphere light, so shadows have nothing to contrast against. He only has a soft blob under his feet.
2. **The buildings next to him are flat coloured boxes** (chapters 2, 4 and 5): blank beige walls with floating blue rectangles, uniform yellow panes. The rows further back already have drawn facades with frames, sills, shutters and mixed lit windows, and look better than the hero buildings.
3. **Bystanders are peg figures with ball heads**, standing next to a realistic person (chapter 3). Chapter 2 has loose grey spheres on the pavement.
4. **Ground is a flat colour with faint grain.** It fills a third of every frame.
5. **Trees are smooth green blobs** in every chapter.
6. **London is the best chapter** because a photographic skyline does the work. That is the direction for the rest.

The page below the walk already looks professional. Its problems are smaller: on phones the hint line under the hero buttons is unreadable over the tree and "Explore my work" is low contrast; a lot of label text is 8 to 10px; the year caption gets struck through by road markings; revealed sections pop instead of easing in.

## Tooling for whoever implements

`shot.mjs` (in this session's scratchpad) drives the installed Chrome headless, with no dependencies:

```sh
node shot.mjs http://localhost:4401/ <outDir> 1280x800 0.06,0.24,0.41,0.58,0.74,0.93   # one stop per chapter
node shot.mjs http://localhost:4401/ <outDir> 375x812 0,0.24,0.74,1.3                   # phone
```

Stops are progress through the walk (0 to 1; above 1 is the page below it). Take a "before" set first, then compare after every change. Gates for every packet: `npm run typecheck`, `npm test`, `npm run build`. No commits, pushes or branches by implementers.

## Wave 1 (done, uncommitted on branch `site-polish`, cut from `origin/main`)

All three packets are merged and pass typecheck, tests and build. The missing shadows had a second cause the plan did not know about: the shadow camera's bounds were assigned but `updateProjectionMatrix()` was never called, so shadows only covered three.js's default 10 m box.

Left over from wave 1: bystanders have human proportions but stand stiffly; viaduct pillars, vehicles and trees are still plain; plaster and stone facades are slightly blocky up close; the keyboard shortcuts were type-checked but not pressed in a browser; frame rate was not measured.

### Packet 1: light and shadow (`walk.ts`, `README.md`)

- Add a per-chapter sun azimuth (`sunZ`) to `KEYS` and use it for `sun.position` and the sky's `sunDir`. Starting values: `sunY` `[8, 20, 34, 6, 14, 20]`, `sunZ` `[-18, 12, 10, -18, -18, -18]`. Morning and noon are lit from the camera side so facades and his face are lit and shadows fall behind him; dawn and golden hour stay backlit with long shadows towards the camera; rain and night are untouched.
- Rebalance sun against hemisphere light per chapter so shadowed ground is clearly darker than sunlit ground, while overall brightness stays close to today's.
- Widen the shadow camera so the higher sun still covers the street around him.
- Idle rendering: cap at about 30 fps (`if (idling && now - last < 30) return;`) instead of one frame in three, which is 20 fps on a 60 Hz screen and 10 fps on a Mac capped at 30, exactly while a visitor is reading a card.
- Left and right arrows step between chapters; 1 to 6 jump to one.

Done when: in chapters 1 to 4 he, the poles, the trees and the nearby buildings cast clearly visible shadows on the ground; his face is never black; chapters 5 and 6 look as they do now.

### Packet 2: sets (`scenes.ts`, `dressing.ts`, `kit.ts`, new files in `src/scripts/walk/`)

- Hero buildings in chapters 2, 4 and 5 wear the same drawn facades as the back rows (move the facade code to its own module so both files can use it). No large single-colour wall and no uniform yellow pane left in frame.
- Bystanders get human proportions and muted clothes instead of pegs with ball heads. The loose spheres in chapter 2 become proper bollards or go.
- Ground gets a drawn material per surface: asphalt with speckle and patches, paving slabs with joints, grass with colour variation, packed dirt with pebbles, each with a matching normal map. No downloaded assets.

Done when: at each of the six stops nothing in the middle distance reads as an untextured box, and the ground reads as its material.

### Packet 3: page (`global.css`, `site.ts`, `index.astro`)

| # | Change | Why |
|---|--------|-----|
| 1 | Delete the `body::after` noise overlay | Opacity 0.009: invisible, but a fixed full-screen layer composited over the canvas every frame |
| 2 | Remove `backdrop-filter` from the chapter card | The card is 92 to 94% opaque, so the blur barely shows, and the browser re-blurs the moving canvas behind it every frame |
| 3 | Delete dead `.next` rules | Nothing uses them |
| 4 | One-shot CSS reveal | Today items are visible, snap to 25% opacity, then animate, and replay on every re-entry |
| 5 | Header scroll-spy (`aria-current` on the section in view) and a more solid header after the walk | No sense of place on a long page |
| 6 | Copy button beside the email | `mailto:` does nothing for webmail users |
| 7 | Preload the opening character's models and textures | They only start downloading after the 785 kB walk chunk has loaded and run |
| 8 | Phone hero: hide the hint line, extend the scrim behind the buttons | Unreadable over the tree |
| 9 | Type floor: nothing under 11px | 21 declarations are 10px or less, down to 7.5px |
| 10 | Soft scrim behind the year and place caption | Road markings strike through the year |

## Wave 2 (after wave 1 is reviewed; each needs a decision from you)

1. **Trees.** Break up the blob canopies with alpha-cut leaf clusters so the outline is foliage, not a smooth lump.
2. **Depth of field.** A gentle blur on the far background would blend drawn sets with photo backdrops and put the focus on him. Needs a depth texture on the render target; costs some GPU time.
3. **Real ground and wall textures.** CC0 photo textures (Poly Haven, ambientCG) would beat anything drawn in code, for about 1 MB more download. Needs your OK to download assets.
4. **Vehicles.** The rickshaw and bus are built from boxes. CC0 models would fix it (downloads again), or they can move into the background.
5. **Ambient occlusion by default on desktop.** `?quality=2` already does it; it is never chosen automatically. Needs frame-rate testing on your Mac.
6. **Project cards.** Brainvault and Fashion AI use drawn placeholders. Real screenshots would look more credible; three Claude Anchor screenshots in `public/media/popover-*` ship unused.
7. **Dissolve cost.** For 28% of the scroll range the scene is rendered twice at full resolution. Measure before changing.
8. **`og-image.png` is 643 kB**; a JPEG would be about 150 kB.

## Looked at and left alone

- Fast scrolling cutting to black, the walking-speed cap, pixel ratio and the quality ladder: deliberate, and tuned in the last two commits.
- Hiding other chapters' objects: three.js already culls per mesh.
- Click-to-wave and other playful extras: dropped, since the goal is realism and polish.
