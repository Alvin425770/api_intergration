# Week 8 Blind Test Report

## 1. What happened when our README was tested

**STATUS: OPEN. Waiting on feedback from team8.**

<!-- Fill in once team8 reports back:
- Did they succeed in making a working call?
- How long did it take?
- Where (if anywhere) did they get stuck?
-->

## 2. Our blind test of team8's ShieldBox README

We tested team8's ShieldBox README using only the README, with no messages to them and no looking at their code.

**What worked**
- Quickstart
- 400 and 404 error examples
- Local run instructions

**Gaps found in their README**
1. The live demo URL is still the placeholder `<FILL IN YOUR IP>`, so a stranger cannot reach the live API.
2. `npm install` left a broken `content-type` package. Reinstalling fixed it.
3. The POST examples use `\"` escaping, which breaks in PowerShell.
4. Malformed JSON returns an HTML error page instead of a JSON error, which contradicts the documented error format.

## 3. Fixes and known gaps in our own docs

**Gap found (being verified):** In a clean clone, `server/` has no `.env.example` or `schema.sql`, so the local-run steps in our README fail. We are checking whether these files exist elsewhere in the repo.

- If they exist elsewhere: fix the paths in the README.
- If they are missing: commit them and update the local-run section.

<!-- Add any further fixes made after team8's feedback arrives. -->

## 4. Honest summary

<!-- Write after section 1 is complete. If team8 never got a working response from our README, say so plainly. -->

Our own README currently has at least one local-run gap (missing `.env.example` and `schema.sql` in a clean clone), found while preparing this report. We have not yet confirmed whether a stranger can get a working response from our README. That result depends on team8's feedback.