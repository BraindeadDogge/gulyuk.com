---
title: Why I distrust single-number evaluations
summary: One accuracy figure hides the slice where the model is bad. A short argument for reporting a table nobody wants to read.
date: 2026-08-21
topics: [ml, tools]
kind: research
maturity: evergreen
---

Placeholder essay in the right shape. Replace it with a real one.

A model with 91% accuracy is not a model with 91% accuracy everywhere. It is a model that is right 97% of the time on the cases that are easy to collect and 60% of the time on the ones that matter. The average is dominated by the first group, so the number goes up when you add easy data and nobody notices.

Three habits that help:

1. Report by slice, and keep the slice definitions in version control next to the code.
2. Show the confidence interval. If it overlaps the baseline, say so in the first sentence.
3. Keep one fixed, ugly, hand-labelled set that never gets cleaned up.

None of this is new. It still gets skipped, mostly because a table is harder to put in a slide title than a number.
