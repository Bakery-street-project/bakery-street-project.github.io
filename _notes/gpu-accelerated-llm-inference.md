---
title: "GPU-Accelerated LLM Inference: A Practical Guide"
date: 2026-08-08
permalink: /notes/gpu-accelerated-llm-inference/
tags:
  - ai
  - llm
  - cuda
  - inference
  - go
  - python
excerpt: "Practical lessons from running LLMs locally with NVIDIA GPUs, Ollama, and llama.cpp — memory management, context windows, and throughput optimization."
---

# GPU-Accelerated LLM Inference: A Practical Guide

After building [go-ai-coder](https://github.com/BoozeLee/go-ai-coder) and experimenting with local LLM inference for [codeqai](https://github.com/BoozeLee/codeqai), I've accumulated practical knowledge about running LLMs efficiently on consumer hardware.

## Hardware Reality Check

I run on an **NVIDIA GTX 1080 (8GB VRAM)** — not exactly an A100, but sufficient for many use cases with the right optimization.

### Model Size vs. VRAM

| Model | VRAM Usage | Tokens/sec | Context Window | Use Case |
|-------|-----------|------------|----------------|----------|
| CodeLlama 7B | ~5.2 GB | ~45 tok/s | 4K | Code completion, small context |
| CodeLlama 13B | ~7.8 GB | ~28 tok/s | 4K | Complex reasoning, larger context |
| Mistral 7B | ~4.8 GB | ~52 tok/s | 8K | General purpose, fast |
| Llama 2 13B | ~7.5 GB | ~30 tok/s | 4K | Chat, instruction following |

The 8GB VRAM ceiling means:
- 7B models run comfortably with room for KV cache
- 13B models work but leave little headroom
- 30B+ models require CPU offloading or quantization

## Memory Management Strategies

### 1. Quantization
Using GGUF quantization (4-bit, 5-bit, 8-bit) dramatically reduces VRAM usage with minimal quality loss:

- **4-bit**: ~60% size reduction, ~2-3% quality loss
- **5-bit**: ~50% size reduction, ~1-2% quality loss
- **8-bit**: ~25% size reduction, <1% quality loss

### 2. Context Window Optimization
The KV cache grows linearly with context length. For a 4K context:
- 7B model: ~1.2 GB KV cache
- 13B model: ~2.4 GB KV cache

For 8K context, double those numbers. This is often the real bottleneck, not the model weights themselves.

### 3. Batch Processing
Processing multiple requests in parallel can increase throughput by 2-3x, but increases memory pressure. Find the right batch size for your hardware.

## Tooling

### Ollama
The easiest way to run local LLMs:
```bash
ollama pull codellama:13b-instruct
ollama run codellama:13b-instruct
```

Ollama handles model loading, quantization, and API serving out of the box.

### llama.cpp
For more control, llama.cpp provides:
- Custom quantization options
- GPU layer offloading
- Batch processing
- Lower memory overhead

### vLLM / TGI
For production serving with multiple GPUs or higher throughput, consider:
- **vLLM**: PagedAttention, continuous batching
- **Text Generation Inference (TGI)**: HuggingFace's serving solution

## Throughput Optimization

### GPU Utilization
Monitor with `nvidia-smi`:
- Low GPU utilization = increase batch size or use faster models
- High VRAM usage = reduce context window or use quantization
- Low CPU usage = good (GPU is doing the work)

### Context Window Tradeoffs
- **Short context (2K-4K)**: Fast, low memory, good for code completion
- **Medium context (8K-16K)**: Balanced, good for document analysis
- **Long context (32K+)**: Slow, high memory, use only when necessary

## Production Considerations

### 1. Cold Start
Loading a 13B model takes 3-5 seconds on GTX 1080. Keep models warm in production or use a smaller model for quick responses.

### 2. Queue Management
Implement request queuing to avoid OOM errors during traffic spikes.

### 3. Fallback Strategy
Always have a CPU fallback or smaller model for when GPU memory is exhausted.

### 4. Monitoring
Track:
- Tokens per second
- VRAM usage
- Queue depth
- Error rate (OOM, timeouts)

## Code Example

Here's a minimal Go example using Ollama:

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type OllamaRequest struct {
    Model  string `json:"model"`
    Prompt string `json:"prompt"`
    Stream bool   `json:"stream"`
}

type OllamaResponse struct {
    Response string `json:"response"`
}

func generateCode(prompt string) (string, error) {
    reqBody := OllamaRequest{
        Model:  "codellama:13b-instruct",
        Prompt: prompt,
        Stream: false,
    }
    
    jsonData, _ := json.Marshal(reqBody)
    resp, err := http.Post("http://localhost:11434/api/generate", "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var result OllamaResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return result.Response, nil
}
```

## Conclusion

Running LLMs locally is viable for many production use cases. The key is understanding your hardware constraints, choosing the right quantization, and optimizing for your specific workload. Consumer GPUs can handle 7B-13B models effectively with the right setup.

The future is local-first, private, and cost-effective.
