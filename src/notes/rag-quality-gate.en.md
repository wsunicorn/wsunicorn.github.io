---
slug: rag-quality-gate
lang: en
title: Five things a quality gate taught me about RAG
description: Real incidents from viRAGops, where every prompt, model or retrieval change has to pass an evaluation before it goes live.
date: 2026-11-15
project: viragops
minutes: 4
---

viRAGops answers students' questions about the academic regulations of my university. The chatbot was the easy part. The work went into what surrounds it: a 300-question golden set in six groups, a four-tier evaluation engine, and a gate in CI that returns PASS, WARN or BLOCK for every change to a prompt, a model or the retrieval setup.

Here are five things that went wrong and what each one changed.

## 1. The golden set had a wrong answer in it

I was looking into why citation accuracy was low on multi-hop questions. Six questions turned out to cite the wrong source, and one question, `q_021`, had a reference answer that was simply wrong. The model's answer was better than mine.

Evaluation data is data. It needs the same suspicion as the system it measures.

## 2. A fix for one metric broke another

Prompt p6 improved citations. The full 300-question run then showed refusal accuracy on adversarial questions dropping from 0.909 to 0.636. The model still refused the right questions, but it stopped setting the refusal flag that the rest of the system reads. Prompt p7 fixed that before p6 ever went live.

This is the case for running the whole evaluation on every change, not only the metric you were trying to move.

## 3. 99.3% of one evaluation was answered by the backup model

A full run of 300 questions used up the free quota halfway through, and the gateway quietly switched to the fallback model. The summary numbers looked normal. They described a different system.

Since then every report splits results by which model actually answered, and the fallback rate is the first number I read.

## 4. I measured the wrong model without knowing

In one experiment, all ten calls to the "strong" model tier landed on another model, because the judge shared that tier's API key and had used most of its quota. Every call succeeded. I caught it with an isolated call, measured again through a different route, and confirmed it from the proxy's response headers.

A successful call is not proof that you called what you think you called.

## 5. CI was red for three days

A new import of the Prometheus client sat in the main code path, but the CI file did not install that dependency group. Every commit after it failed at test collection, and nothing told me. The same kind of mistake had already happened once.

The rule now: if core code imports an optional dependency, the CI change goes in the same commit.

## Where it stands

Hybrid retrieval reaches Recall@5 0.932. Citation accuracy is 0.838, still short of the 0.85 target, and much lower on multi-hop (0.678) and ambiguous questions (0.546). On 16 simulated changes, the gate blocked all nine bad ones and none of the good ones. Those were simulated scenarios, and the gate cannot roll a change back by itself yet.

The fix I have not tried for multi-hop answers is to require a minimum number of citations in the citation layer itself, instead of asking the prompt for it. The experiment reports, including the negative ones, are in the [repository](https://github.com/wsunicorn/viragops).
