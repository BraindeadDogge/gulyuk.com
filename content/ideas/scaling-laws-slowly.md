---
title: Scaling laws, read slowly
summary: Notes on fitting a power law to loss curves, and the three ways the fit quietly lies.
date: 2026-07-30
topics: [ml, math]
kind: research
maturity: seedling
math: true
---

Placeholder note. The shape is real, the claims are filler.

The usual form is $L(N) = L_\infty + a N^{-\alpha}$, where $N$ is parameters or tokens. Plot it on log-log axes and the points fall on a line, until you subtract $L_\infty$ and they do not.

Where the fit lies:

- **Irreducible loss.** Fix $L_\infty$ by hand and $\alpha$ moves a lot. Fit it and the standard error is wide.
- **Range.** Three decades of $N$ is a curve. One decade is a guess with a straight edge.
- **Mixing regimes.** A sweep that changes batch size along with $N$ is two experiments.

When I fit these, I report $\alpha$ with an interval and show the residuals. If the residuals have a shape, the power law is a description, not a law.
