# gulyuk.com brand kit

The mark is **ReLU and a miss**: the activation function every neural network starts with (flat, then straight up),
with one point that does not sit on the curve. It comes from the function-approximation essay: a model is a curve
you fit, and the data never fits it exactly. The dot is the only accent colour, and it doubles as a full stop.

## Colours

| Role | Light | Dark |
|---|---|---|
| Ink | `#1B1A17` | `#ECE8DF` |
| Accent (the miss) | `#C2301A` | `#FF6B4A` |
| Paper | `#F4F1EA` | `#141311` |

One accent, no gradients, no shadows. In one-colour use (`*-mono`, `*-white`) the dot takes the same colour as the line.

## Files

| File | Use |
|---|---|
| `mark-colour.svg`, `mark-dark.svg` | The mark on paper or on dark. The default. |
| `mark-mono.svg`, `mark-white.svg` | One-colour: print, stamps, embroidery, dark photos. |
| `mark-small.svg` | Heavier cut for 16 to 48 px (tab icons, avatars). Never use it large. |
| `lockup-horizontal-*.svg` | Mark and `gulyuk.com`. Headers, email signatures. |
| `lockup-stacked-*.svg` | Mark above `gulyuk.com`. Slides, covers, square spaces. |
| `wordmark-*.svg` | `gulyuk.com` alone, the full stop in the accent. Where the mark is already nearby. |
| `share-card.svg` | Source of the 1200x630 link preview (`public/og-image.png`). |

All files are outlines: no live text, no strokes, no fonts needed. The wordmark is Commit Mono Bold (SIL Open Font
License, free for logo use) converted to paths.

The site's own icons are in `public/`: `favicon.ico` (16, 32, 48 px), `favicon.svg` (follows the system light or dark
setting), `apple-touch-icon.png` (180 px), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`
and `og-image.png`. They put the mark on a paper tile, so they read on any browser bar or home screen.

## Rules

- **Clear space:** at least the height of the dot on every side.
- **Minimum size:** mark 16 px wide (use `mark-small.svg` below 64 px); lockups 120 px wide.
- **Do not** rotate, stretch, recolour the dot, add a shadow or outline, or place the paper-coloured mark on a photo.
- **On photos or busy backgrounds** use `mark-white.svg` or `mark-mono.svg` on a calm area.
- Keep the dot above the flat part, to the left of the rise. Mirroring the mark changes its meaning (the curve is
  read left to right).

## Honest limits

- No trademark search has been done. Run one before using the mark commercially.
- The mark was built from code (geometry, not hand-drawn). To change it, edit the SVGs here and re-export the PNG and
  ICO icons from them. Tiles use paper `#F4F1EA`, with the mark filling about 62 to 64% of the width (52% for the
  maskable icon, so it survives the circular crop) and 80% for the 16 to 48 px tab sizes.
