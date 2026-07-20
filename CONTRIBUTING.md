# Contributing

## Branch flow
- Work on a feature branch.
- Keep `main` stable and clean.
- Merge only after `npm run check` and `npm run build` pass.

## Commit rules
- Use short, clear commit messages.
- Keep one logical change per commit when possible.

## Safety rules
- Do not commit `.env` or secrets.
- Do not commit `node_modules`, `dist`, or local build artifacts.
- Keep database writes behind the existing readonly safeguards.

## Suggested workflow
1. Create a branch from `main`.
2. Make the change.
3. Run `npm run check`.
4. Run `npm run build`.
5. Commit and push.
6. Open a pull request.
