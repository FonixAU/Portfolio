---
title: "Nexus"
kind: "asteroid"
order: 24
what: "Node-graph agentic coding pipeline that maps, mutates, tests and merges its own changes"
when: "2026"
stack: ["TypeScript","Node","pnpm","Ollama","git worktrees"]
---

A pipeline that maps a codebase, simulates a change, mutates it inside an isolated git worktree, tests it and merges only what passes. Headless through a CLI today with a visual graph view planned, and designed so pointing it at its own source is a config value rather than a new subsystem.
