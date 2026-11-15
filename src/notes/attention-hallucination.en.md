---
slug: attention-hallucination
lang: en
title: Reading hallucinations from a model's attention
description: What my thesis found when it asked whether an open model's attention can tell a grounded RAG answer from a made-up one.
date: 2026-11-15
project: vihallulens
minutes: 5
---

A RAG system retrieves a few passages and asks a language model to answer from them. The answer can still say something the passages do not support. The usual check is to send every answer to a second, larger model and ask it to judge. That works, but it is slow, it costs money per answer, and for Vietnamese there was no open tool built for it.

My thesis asked a narrower question: when a model reads an answer together with its context, does the way it spreads attention already tell us whether the answer is grounded?

## The signal

Inside a transformer, each attention head decides how much weight every token gives to the tokens before it. While the model reads an answer, a head can look back at the context or at the answer it has read so far. The share that goes to the context is the **lookback ratio**, an idea from the Lookback Lens paper. An answer that stays close to its evidence should make the model look back more.

I used Qwen2.5-7B as the reader. It has 28 layers with 28 heads each. One layer overflowed in 16-bit arithmetic on my GPU, so I dropped it, which leaves 27 × 28 = 756 heads and 756 ratios per answer. A linear classifier on those 756 numbers labels the answer as grounded, intrinsic hallucination (contradicts the context) or extrinsic hallucination (adds facts the context does not contain). The classifier has 2,271 parameters: 756 weights for each of three classes, plus three biases.

## What it reached

On ViHallu, a Vietnamese dataset of 7,000 answers, the probe reached a three-class macro-F1 of **0.745** on a test set split by context, so no passage appears in both training and testing. A fully fine-tuned PhoBERT-large, with 369 million parameters, reached 0.749. The probe was also better than PhoBERT-large on the hardest class, intrinsic hallucinations.

That does not make it the best detector. A fine-tuned XLM-R-large reached 0.776. The case for the probe is cost: it adds almost nothing on top of a forward pass that a RAG system may already run, and it needs no paid judge.

The attention also points at the right place. On ISE-DSC01, where the evidence sentence is labelled, the strongest head put most of its attention on the evidence chunk in 87.8% of samples, about 14 times what chance would give. That number comes from the best of 756 heads, chosen on the same data, so the report lists the average over all heads next to it.

## What did not work

My own contribution was a **chunk-aware** ratio: instead of one ratio over the whole context, one per passage, plus a few statistics about its shape. It produced the best-calibrated detector in the study, with an expected calibration error of 0.044 against 0.109 for the pooled ratio, and it can show which passage the answer leaned on. Its macro-F1 was 0.757 against 0.745, and with 700 test samples that gap sits inside the confidence interval. I report it as not significant.

The three-class detector also did not transfer to the other datasets. Most of the accuracy conclusions rest on one dataset whose answers were written by one model.

## What I would try next

The detector's most confident mistakes are answers that copy the context correctly and slip in one unsupported claim. Averaging attention over the whole answer hides that claim. The next step is to score each part of an answer against labels at the same level, so a single bad sentence cannot hide inside a good paragraph.

The code, the attention viewer and all 19 experiments are in the [repository](https://github.com/wsunicorn/vihallulens).
