---
name: document-plan
description: Document a plan into markdown format for LLM coding agent consumption
---

**Create a fully detaild plan doucmentation** with the following requirements:
- The plan must have a short but descriptive name ending with -plan
- The document format is markdown
- The file is saved into the agent_workspace folder
- Each main segment has a checklists for each work item where progress can be traced
- All details are included in the plan document for the implementation (documentation references as needed)

**IMPORTANT**
An LLM coding agent with no context must be able to develop the handed off tasks based on the plan.
DO NOT start implementation. This will be done by a different agent!