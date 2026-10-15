---
title: A graph layout that renders the same twice
summary: How this site's home graph is laid out at build time so the server and the browser draw identical pixels.
date: 2026-10-10
topics: [tools, visualization]
kind: note
maturity: budding
---

Force-directed layouts are random by habit: shuffle the starting positions, run until things stop moving, and get a slightly different picture each time. That is fine in a notebook. On a server-rendered page it means the browser repaints the graph in different places than the HTML said, and the nodes jump.

The fix here is to make the layout a build step. The initial positions come from a golden-angle spiral, d3's random source is replaced with a small seeded generator, the simulation runs a fixed number of ticks without a timer, and the result is rounded to one decimal. The coordinates go into the page as plain `cx` and `cy`.

The browser then starts from those exact coordinates. Dragging a node reheats the simulation a little. Letting go lets it settle back, close to where it began.

The part that surprised me was the rounding. Without it, two machines disagreed in the fifth decimal and the diff in the generated HTML was noise.
