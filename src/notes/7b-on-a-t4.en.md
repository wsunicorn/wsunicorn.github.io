---
slug: 7b-on-a-t4
lang: en
title: Reading a 7B model's attention on a 16 GB GPU
description: The memory arithmetic, a float16 overflow and the other constraints behind running Qwen2.5-7B as an attention reader on one Tesla T4.
date: 2026-11-15
project: vihallulens
minutes: 4
---

My thesis needed the attention weights of a 7-billion-parameter model for thousands of answers. The hardware was one Tesla T4 with 16 GB of memory, the kind Kaggle gives away. These are the constraints that shaped the code, roughly in the order I ran into them.

## The weights do not fit, so quantise

Qwen2.5-7B in 16-bit floats takes about 15 GB. That leaves nothing for activations. Loading the weights in 4-bit NormalFloat (NF4) brings them down to about 5–6 GB. The arithmetic still runs in float16. Loading takes around two minutes on a T4, so the REST service opens its port immediately and loads the model in a background thread: `/health` reports `loading`, `ok` or `error`, and the scoring routes return 503 until the model is ready.

## The attention does not fit either, so hook one layer at a time

Fast attention kernels such as FlashAttention never build the full n × n attention matrix, which is exactly what I needed to read. Turning them off brings the matrix back, and its size grows with the square of the sequence length. One layer of Qwen2.5-7B has 28 heads, so in float16:

| Sequence length | One layer | All 28 layers at once |
|---|---|---|
| 2,048 tokens | 0.23 GB | 6.6 GB |
| 4,096 tokens | 0.94 GB | 26 GB |
| 8,192 tokens | 3.76 GB | 105 GB |

The longest context in one of my datasets was 6,543 tokens. Keeping every layer was never an option, and the table says so before writing any code. A forward hook on each layer reduces the attention to the 28 lookback ratios I need as soon as that layer finishes, then drops the matrix. Memory stays at the one-layer column.

## Layer 27 overflowed in float16

On 20 out of 20 test samples, the last layer produced non-finite values in float16. The other 27 layers matched a float32 run, with an average difference of 0.07% of the scale and no drift towards the later layers. Float32 would have been 3.6 times slower, so I kept float16 and dropped layer 27. That is why the detector has 27 × 28 = 756 features rather than 784.

The overflow was not the same across model sizes in the same family, so I measured it separately for every reader model I used instead of assuming.

## The reader cannot also be the generator

The demo RAG system needs a model to write answers. The obvious choice was the 7B model already in memory, but its broken last layer feeds the output head, and the logits came out as NaN, so every generated token was "!". The detector can skip a layer; generation cannot. Two copies of the 7B model do not fit on one card either — I tried, and it ran out of memory while loading. The demo therefore generates with Qwen2.5-3B in bfloat16 and reads with the 7B.

On a larger GPU with native bfloat16, one 7B model could do both jobs. On a T4 it cannot, and the thesis says so where it discusses cost.

## Small things that cost a day each

- The first answer token has no earlier answer token to look back at, so its ratio is always 1 (or 0 after underflow in float16). The feature arrays skip it.
- Scores on the development set differed by up to 0.0075 between two compute environments. Comparisons now always run in the same one.

The extraction code and the hooks are in [`src/vihallulens`](https://github.com/wsunicorn/vihallulens).
