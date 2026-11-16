# Retrospective: NyumbaHub API Integration

**Author:** Alvin Bogonko Mwanyumba (Student ID: 221671)  
**Role:** API Lead (Group 10 — NyumbaHub)  
**Upstream Partner:** GymBuddy | **Downstream Consumer:** FundiLink  
**Date:** 16 November 2026  

---

### 1. The Hardest Part of the Lifecycle: Integrate

The single hardest stage of the lifecycle for our team was **Integrate**. While developing endpoints within our own codebase was straightforward, integrating with our assigned partner, GymBuddy, presented a fundamental domain mismatch that our team struggled to resolve.

NyumbaHub is a property rental platform connecting tenants and landlords, whereas GymBuddy is a fitness and gym management system. From our initial planning sessions, our team struggled to see how two completely different applications could meaningfully work together. Because we lacked a natural product connection between rental housing and gym memberships, our integration ended up feeling mechanical and forced. We integrated partner endpoints in a way that offered little practical value to an actual tenant looking for a house. In fact, displaying gym memberships inside a real estate portal was more likely to confuse users than help them.

The difficulty was driven by an unclear product decision and domain dissonance. Without a genuine user need linking housing to fitness, deciding what data to consume and how to present it made integration the most difficult part of the project.

---

### 2. One Real Cross-Team Issue: Breaking Downstream API Availability for FundiLink

Our most significant cross-team breakdown occurred when we broke the API for our downstream consumer, FundiLink, during the implementation of our authentication and monitoring layers.

While adding API key verification middleware and our `/stats` monitoring routes to our backend, we introduced errors into our codebase. Unaware of the latent bugs, we pushed the code to our repository, triggering an automatic deployment on Render. Because the server failed on startup due to these routing errors, our live Render instance became non-functional, returning `500 Internal Server Error` responses and dropping incoming requests.

FundiLink, who actively relied on consuming our live endpoints, was immediately blocked. Their application could not reach our service, halting their integration progress. They contacted us to report that our API was completely down and returning errors.

Once alerted, I reviewed the live logs on Render, identified the runtime syntax errors in our authentication and monitoring handlers, and fixed the code locally. After verifying the routes, I pushed a hotfix to Render, which restored service health. I then tested our live endpoints across multiple devices to confirm they returned valid data. The entire process—from their report to troubleshooting, bug fixing, and redeployment—took approximately two hours.

---

### 3. What I Would Design Differently

If restarting this project, there are two key areas I would approach differently:

1. **Be Far More Rigorous with API Need Statements and Endpoints:**  
   Our initial API Need statements were too vague, leading us to build endpoints without a clear understanding of consumer requirements. Starting over, I would spend dedicated time during the planning phase defining exactly what data consumers require, how parameters should be filtered, and the exact response contracts. This would prevent developing endpoints that do not solve real problems.

2. **Understand Ring Partners' Systems Before Writing Code:**  
   I would invest significant time in understanding our partners' business domains and architectures before writing integration code. Attempting to consume GymBuddy without thoroughly understanding their system resulted in an awkward integration that felt disconnected from NyumbaHub. A solid understanding of both GymBuddy and FundiLink upfront would have allowed us to design meaningful touchpoints rather than arbitrary endpoint calls that added little user value.

---

### 4. My Contribution: Honest Evaluation (8 / 10)

I rate my individual contribution to the team as an **8 out of 10**.

**What I Owned:**  
Throughout the project lifecycle, I took ownership of the following key areas:
- **System Troubleshooting and Bug Fixing:** I was the primary troubleshooter whenever server crashes, broken routes, or runtime exceptions occurred, diagnosing root causes and fixing them.
- **Render Cloud Deployment:** I managed the deployment pipeline on Render, configuring environment variables and ensuring our live API was accessible.
- **Work Distribution:** I divided milestones and technical tasks among team members based on their strengths.
- **Code Reviews and Merging:** I reviewed teammate pull requests, resolved merge conflicts, and maintained repository health before merging into `main`.
- **Team Coordination:** I coordinated team activities across all stages, from presentations and documentation to the final application build.

**Where I Carried Others vs. Where Others Carried Me:**  
I carried the team in infrastructure management, Render deployments, critical bug remediation, and overall coordination. When technical issues threatened to stall progress, I stepped in to fix the codebase and restore uptime. Conversely, my teammates carried me significantly in other areas: they built the frontend user interface components, executed testing and QA checks, and drafted core documentation. Their frontend work and testing gave our backend a functional, presentable interface during demonstrations.
