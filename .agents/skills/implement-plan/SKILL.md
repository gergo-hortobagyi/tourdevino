---
name: implement-plan
description: Implement a plan
---

Execute the attached plan fully and unattended.
Autonomy contract:
1) Do not ask for confirmations.
2) Make reasonable defaults based on existing code conventions and the dev guides.
3) Only ask a question if:
   - a required secret/credential is missing, or
   - action is destructive/production-impacting.
Execution requirements:
- Treat the plan as a handoff document. Another agent should be able to take over your work at any given point.
- Always update the status fields/todo lists in the plan with your actual status.
- Identify where you left of if the plan indicates that work was already done. 
- Complete tasks in plan order unless parallelization is safe.
- After each phase: run relevant lint/tests/build and fix issues.
- Keep changes consistent with existing patterns.
- Do not revert unrelated existing git changes.
- Always keep track of remaining risks or follow-ups.
- Always update relevant project documentation.