---
title: Teaching a small network to draw a curve
summary: A tiny neural network trains in your browser to approximate a function. Move the sliders and watch where it fails.
date: 2026-09-12
updated: 2026-10-02
topics: [ml, math, visualization]
kind: project
maturity: budding
math: true
---

A one-hidden-layer network can approximate any continuous function on an interval, given enough hidden units. That is the universal approximation theorem, and it says nothing about how many units you need, how long training takes, or what the fit looks like halfway through. The demo below lets you watch those parts.

The network is $\hat f(x) = \sum_{i=1}^{H} v_i \tanh(w_i x + b_i) + c$, trained by plain gradient descent on the whole sample at every step, minimising the squared error

$$
L = \frac{1}{N} \sum_{n=1}^{N} \left( \hat f(x_n) - f(x_n) \right)^2 .
$$

::function-approximation
::

## What to try

Pick the sine target and give the network two hidden units. It will find a smooth bump and stop. Raise the width to eight and the fit follows two periods. Now switch to the step function: the network never gets the corner right, it only gets it steeper. That is not a bug in the training loop. A sum of $\tanh$ units is smooth everywhere, so a jump can only be approximated.

## Notes

- The target is sampled at 64 fixed points, so the loss curve is cheap and repeatable.
- Reset reseeds the weights with the same seed. Same seed, same curve.
- Everything runs in the page, about 80 lines of plain arithmetic, no library.
