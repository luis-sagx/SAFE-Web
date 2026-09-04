# SonarCloud Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the SonarCloud findings from `main` while preserving the educational behavior of SAFE-Web scenarios.

**Architecture:** Correct security and CI findings first, then centralize repeated frontend behavior, then refactor accessibility and maintainability findings in focused groups. Intentional phishing URLs and test credentials remain only with local, documented suppressions.

**Tech Stack:** React, TypeScript, Vite, NestJS, Python, GitHub Actions, SonarCloud, Vitest/Jest.

**Spec:** `docs/superpowers/specs/2026-09-03-sonarcloud-remediation-design.md`

## Global Constraints

- Do not add broad Sonar exclusions or change scenario content.
- Preserve existing API contracts and scenario transitions.
- Run focused tests after each logic-bearing group, then the complete frontend/backend verification.

### Task 1: Establish baseline and issue fixtures

**Files:** No production changes; use Sonar API snapshot and existing tests.

- [ ] Record the current issue count and inspect the working tree.
- [ ] Install dependencies in the worktree and run the existing frontend/backend test commands.
- [ ] If baseline tests fail, record the failure before changing code.

### Task 2: Harden CI and local security utilities

**Files:** `.github/workflows/ci.yml`, `frontend/scripts/voces.py`, `frontend/test-cinco.mjs`, `backend/test/auth.e2e-spec.ts`.

- [ ] Pin every GitHub Action to its reviewed full commit SHA and replace floating container tags with immutable digests.
- [ ] Remove the tracked one-off browser script that reads an absolute external token path, unless it is converted into a parameterized local-only test fixture.
- [ ] Validate any generated voice path with `resolve()` and a containment check before writing/deleting.
- [ ] Mark the deterministic audio filename digest as non-security use using the supported hashlib API, preserving generated filenames.
- [ ] Make e2e credentials explicit test fixtures with a local justification for Sonar.
- [ ] Run Python syntax checks and CI YAML/diff validation.

### Task 3: Centralize secure option shuffling

**Files:** Create `frontend/src/utils/shuffle.ts`; modify the nine physical scenario components and tests.

- [ ] Add a failing unit test for a non-mutating Fisher–Yates shuffle using `crypto.getRandomValues`.
- [ ] Implement the helper with a browser-compatible secure random index and export it.
- [ ] Replace each local `Math.random` implementation and add focused scenario/helper tests.

### Task 4: Fix concrete frontend bugs and accessibility

**Files:** Components identified by S1082, S9011, S6853, S6819, S4084, CSS S7924/S4666/S1874.

- [ ] Add keyboard activation or native controls for clickable non-interactive elements.
- [ ] Add explicit button types and correctly associate labels/outputs.
- [ ] Replace deprecated event types/roles, add media tracks where applicable, and correct contrast/duplicate selectors without changing layout intent.
- [ ] Run frontend tests and accessibility-focused lint/build checks.

### Task 5: Refactor repeated TypeScript code smells

**Files:** Components identified by S3358, S6759, S6770, S6772, S6478, S6479, S6749, S6767, S6847, S6848, S6353, S8786, S7780, S7781, S7785, S1607, S5976, S1135.

- [ ] Replace nested ternaries with named expressions or render helpers.
- [ ] Mark component props readonly, move nested component declarations to module scope, and use stable semantic keys.
- [ ] Remove redundant fragments/unused props, simplify regex/string APIs, parameterize repeated tests, and resolve or document TODOs.
- [ ] Preserve all visible copy and scenario navigation; run focused tests after each family.

### Task 6: Reduce cognitive complexity

**Files:** `frontend/src/components/StoryEscenario.tsx`, `frontend/src/components/ui/DeviceScreen.tsx`, `frontend/src/pages/Admin.tsx`, `frontend/src/pages/Seccion.tsx`, `frontend/src/secciones/fisico/CableComprometido.tsx`, `frontend/src/secciones/fisico/DocumentoAbierto.tsx`.

- [ ] Add regression coverage around the affected branches/transitions.
- [ ] Extract pure decision helpers and module-scope subcomponents until each reported function is within the configured threshold.
- [ ] Run affected tests and the full frontend suite.

### Task 7: Sonar verification and handoff

- [ ] Run frontend lint/test/build, backend lint/test/build, and relevant Python checks.
- [ ] Push the branch and wait for SonarCloud analysis.
- [ ] Re-query the Sonar API, compare against the baseline, and investigate every remaining issue rather than suppressing it broadly.
- [ ] Commit in focused groups and report the branch/commit list and any residual findings.
