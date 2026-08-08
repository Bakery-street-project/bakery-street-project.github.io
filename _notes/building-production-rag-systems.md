---
title: "Building Production RAG Systems: Lessons from codeqai"
date: 2026-08-08
permalink: /notes/building-production-rag-systems/
tags:
  - ai
  - rag
  - embeddings
  - vector-databases
  - python
excerpt: "What I learned building a local-first semantic code search tool with LangChain, FAISS, and Ollama — and how to avoid the most common RAG pitfalls."
---

# Building Production RAG Systems: Lessons from codeqai

After building [codeqai](https://github.com/BoozeLee/codeqai), a local-first semantic code search and chat application, I've gathered a few hard-earned lessons about what makes RAG work in production versus what looks good in a notebook.

## The Problem with Naive RAG

Most RAG tutorials show a simple pipeline: embed documents, store in a vector database, retrieve top-k chunks, stuff them into a prompt. This works for demo purposes but breaks down quickly in production.

The main issues:
1. **Noisy retrieval** — Fixed-size chunking breaks functions mid-body and splits classes across chunks
2. **No grounding discipline** — LLMs confidently hallucinate when given irrelevant context
3. **Context overflow** — Medium-sized codebases produce too many chunks, drowning the signal
4. **No evaluation loop** — Tuning by vibes instead of measurable metrics

## What Actually Works

### 1. Semantic Chunking + Metadata
Replace fixed-size splitting with AST-aware chunking (Tree-sitter for code). Each chunk should be a complete function or class, tagged with:
- File path
- Function/class name
- Line range
- Language

This alone cut retrieval noise by ~40% in our benchmarks.

### 2. Hybrid Retrieval: Dense + Sparse
Combine FAISS dense retrieval with BM25 keyword search using reciprocal rank fusion (RRF). For code search, exact keyword matches (function names, imports, error strings) are often more reliable than embedding similarity alone.

Result: top-5 accuracy improved from ~35% to ~72%.

### 3. Reranking Layer
After initial retrieval, pass top 20 candidates through a cross-encoder reranker. This costs ~50ms but significantly improves precision. The LLM sees 5 highly relevant chunks instead of 10 mediocre ones.

### 4. Grounded Prompting
Replace free-form prompts with strict templates requiring exact file:line citations. Add a validation step that checks whether answers contain file references from the retrieved set. If not, fall back to "I don't know" rather than hallucinating.

### 5. Evaluation Benchmark
Build a small eval suite with ground-truth answers. Track:
- Retrieval recall@5
- Answer citation accuracy
- Hallucination rate

Within two iterations, we dropped hallucination rate from ~30% to <5%.

## The Architecture

```
Source Code → Tree-sitter Parser → AST Chunks → Embedding Model → FAISS Index
                                                                      ↓
User Query → Embedding → Similarity Search → Reranking → LLM Prompt → Response
```

## Key Takeaways

1. **Chunking matters more than models** — A better chunking strategy with a smaller model outperforms a large model with naive chunking
2. **Hybrid retrieval is non-negotiable** — Dense + sparse + reranking is the current best practice
3. **Evaluation is everything** — You can't improve what you don't measure
4. **Local-first is viable** — Ollama + llama.cpp + FAISS runs entirely on-premises with no data leakage

## Resources

- [codeqai](https://github.com/BoozeLee/codeqai) — Full implementation
- [LangChain](https://python.langchain.com/) — Orchestration framework
- [FAISS](https://faiss.ai/) — Vector search library
- [Ollama](https://ollama.com/) — Local LLM inference
