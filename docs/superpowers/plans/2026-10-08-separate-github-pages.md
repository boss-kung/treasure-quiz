# Separate GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Treasure Quiz from its own GitHub repository and GitHub Pages URL while continuing to use the current Supabase project.

**Architecture:** Keep the extracted Vite/React app as a standalone repository. Resolve host/player screens from hash routes so static GitHub Pages needs no rewrite server, and deploy `dist` through the official Pages Actions workflow.

**Tech Stack:** React, TypeScript, Vite, Vitest, Playwright, Supabase, GitHub Actions, GitHub Pages

**Spec:** `docs/specs/github-pages.md`

## Global Constraints

- Repository: `boss-kung/treasure-quiz`, public because standard GitHub Pages is public.
- Pages base path: `/treasure-quiz/`.
- Supabase project ref: `lfvwdeqfyscalfucfhlp`.
- Do not modify or replace the existing ChatGPT Sites deployment.
- Do not commit Supabase secrets or local environment files.

## Review Focus

- A direct `#/host` URL selects the host shell.
- A direct `#/play` URL selects the player shell.
- A Pages base-prefixed path still selects the intended shell.
- Legacy `/host` and `/play` paths keep working for the existing source behavior.
- Unknown or empty routes fail safely to the player shell.

---

### Task 1: Standalone repository baseline

**Files:**
- Create: all application files extracted from `ringquiz/treasure-quiz`
- Create: `docs/specs/github-pages.md`
- Create: `docs/superpowers/plans/2026-10-08-separate-github-pages.md`

**Interfaces:**
- Consumes: committed Treasure Quiz source from the RingQuiz repository.
- Produces: a standalone Git repository with no build output, dependencies, or `.env.local` files tracked.

- [ ] **Step 1: Inspect the extracted file list and Git status**
- [ ] **Step 2: Commit the standalone baseline**
- [ ] **Step 3: Verify `git status --short` is empty**

### Task 2: Static-host-compatible routing

**Files:**
- Modify: `src/lib/routing.test.ts`
- Modify: `src/lib/routing.ts`

**Interfaces:**
- Consumes: pathname and optional hash strings.
- Produces: `getAppPath(pathname?: string, hash?: string): '/host' | '/play'`.

- [ ] **Step 1: Add failing tests for `#/host`, `#/play`, and `/treasure-quiz/host`**
- [ ] **Step 2: Run `npm test -- --run src/lib/routing.test.ts` and confirm the new host case fails**
- [ ] **Step 3: Implement hash-first, base-prefix-tolerant route resolution**
- [ ] **Step 4: Run the focused test and full Vitest suite**
- [ ] **Step 5: Commit the routing change**

### Task 3: GitHub Pages build and deployment

**Files:**
- Modify: `vite.config.ts`
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: `VITE_SUPABASE_ANON_KEY` as a GitHub Actions repository secret.
- Produces: a Pages artifact rooted at `/treasure-quiz/` and the public host/player URLs from the spec.

- [ ] **Step 1: Configure the Vite base path and Pages workflow**
- [ ] **Step 2: Document local setup and the two entry URLs**
- [ ] **Step 3: Run tests, type checking, production build, and Playwright E2E**
- [ ] **Step 4: Commit deployment configuration**
- [ ] **Step 5: Create the GitHub repository, set the Actions secret, enable Pages, and push `main`**
- [ ] **Step 6: Wait for the deployment workflow and verify the live root, host, and player URLs**
