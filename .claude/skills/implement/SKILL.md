# /implement — Implement an Epic as Stacked PRs

## Description
Takes an existing epic (created by `/spec`) and implements each sub-issue in a stacked branch, opening one stacked PR per sub-issue. Does NOT create or modify GitHub issues — that is `/spec`'s job.

## Instructions

When the user runs `/implement <epic-issue-number>`, follow this workflow:

### Phase 1: Read the Epic

1. Fetch the parent issue and all linked sub-issues:
   ```bash
   gh issue view <epic-number>
   ```
2. List the sub-issues in order and confirm the implementation sequence with the user before writing any code.

### Phase 2: Implement in Stacked Branches

For each sub-issue, in order:

1. **Create the branch** — stacked on the previous (first branch is from `main`):
   ```bash
   git checkout -b <branch-name>
   ```
   Branch naming: mirror the sub-issue title slug, e.g. `refactor/proto-rename-action-type-think`, `feat/llm-inference-interface`.

2. **Implement the code changes** for this sub-issue only. Do not include changes belonging to later sub-issues.

3. **Build and test** before committing:
   ```bash
   go build ./... && make test
   ```

4. **Commit** with Conventional Commits + issue reference:
   ```
   type(scope): description

   <summary of what changed and why>

   Closes #<sub-issue>
   ```

5. **Push** the branch:
   ```bash
   git push origin <branch-name>
   ```

### Phase 3: Create Stacked PRs

For each branch, create a PR targeting the **previous branch** (not `main`), except the first which targets `main`:

```bash
gh pr create \
  --base <previous-branch-or-main> \
  --head <this-branch> \
  --title "type(scope): description" \
  --body "..."
```

Every PR body must contain:
- `Closes #<sub-issue>` — wires the sub-issue to auto-close on merge
- `Part of #<parent-epic>` — links back to the epic
- `Stacked on #<previous-PR>` — for PRs 2 and beyond

### Phase 4: Update the Parent Issue

Edit the parent issue body to mark each step as done with its sub-issue and PR numbers:

```bash
gh issue edit <epic-number> --body "..."
```

Checklist format:
```markdown
- [x] #<sub-issue-1> — type(scope): description → PR #<pr-1>
- [x] #<sub-issue-2> — type(scope): description → PR #<pr-2>
```

### Rules

- Do NOT create or edit sub-issues — those already exist from `/spec`
- One branch = one commit = one PR = one sub-issue; never combine steps
- Always build and test before committing each branch
- Stacked PRs must NOT target `main` except the first — targeting `main` breaks the stack
- Confirm the implementation plan with the user before writing any code
