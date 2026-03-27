# /spec — Refine a Feature into a Tracked Epic

## Description
Guided workflow for designing a feature spec, breaking it into ordered sub-issues, and publishing everything to GitHub. Produces a parent epic with a linked implementation plan. Does NOT write code or create PRs — hand off to `/implement` when ready to build.

## Instructions

When the user runs `/spec <feature-name-or-description>`, follow this workflow:

### Phase 1: Gather Information

Walk the user through each section of the spec. Ask one section at a time, offering to help draft content. The sections are:

1. **Context** — What problem does this solve? What is the current state?
2. **Proposal** — High-level solution overview (1-2 paragraphs)
3. **Design** — Detailed technical design: types, interfaces, code flow, code examples where helpful
4. **Changes Required** — List of packages/files affected with specific modifications
5. **Dependencies** — External Go modules, services, assumptions, or prerequisites

For each section, present what you have so far and ask the user to confirm or revise before moving on.

### Phase 2: Break Down into Sub-Issues

Once the spec is complete:

1. Propose a set of implementation steps (sub-issues), where each step maps to exactly **one PR**
2. Each sub-issue should have:
   - A title in Conventional Commits format: `type(scope): description`
   - A body with: Goal, Changes (file-by-file), and Verification steps
3. Ask the user to confirm, reorder, split, or merge steps

### Phase 3: Review & Create

1. Present the **full parent issue** and **all sub-issues** for final review
2. Only after the user explicitly approves, create them using `gh issue create`
3. Create the parent issue first, then create each sub-issue referencing the parent
4. After creating all sub-issues, edit the parent body to replace placeholder checklist items with the actual issue numbers

### Issue Format

**Parent issue:**
```
## Context
...

## Proposal
...

## Design
...

## Changes Required
...

## Dependencies
...

## Implementation Steps
- [ ] #<sub-issue-1> — type(scope): description
- [ ] #<sub-issue-2> — type(scope): description
- ...
```

**Sub-issue:**
```
Parent: #<parent-issue-number>

## Goal
What this step accomplishes.

## Changes
File-by-file modifications with code examples.

## Verification
Build, test, and validation commands.
```

### Labels

Apply to every sub-issue:
- `🧩 sub-issue` (always)
- Component label matching the primary change area: `📋 proto`, `🤖 agent`, `🚌 bus`, `📥 ingestor`, `🔀 dispatcher`, `🌐 http`
- `enhancement` for new features; omit for pure refactors
- `✅ ready`

Apply to the parent issue:
- `📦 epic`
- Relevant component label(s)

### Rules

- Never create issues without explicit user approval
- Keep sub-issues small enough for a single PR (ideally reviewable in one sitting)
- Sub-issue titles double as PR titles — use Conventional Commits format
- Reference the parent issue number in every sub-issue body
- **Stop here** — do not write code, create branches, or open PRs; that is `/implement`'s job
