---
name: rca-fix-regression
description: Analyze, fix, create regression tests
---

1. If the execution context for reproduction is not clear, AskUserQuestion until you have enough information to reproduce the issue.
2. Cover the issue with E2E regression test(s) to reproduce the issue. If the issue cannot be reproduced, stop the process and give a summary.ß
3. Identify the root cause of the issue via root cause analysis.
4. Fix the issue. In case other code or functionality relies on it, ensure that you do not break anything else with the fix causing a regression issue.
5. Then run the test(s) again to ensure that You canthe error is resolved.
6. Identify any other affected functionality, and repeate the process.