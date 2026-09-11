---
name: Daily digest scheduling
description: Reliability constraint for the HiBowan daily admin email on Replit Autoscale.
---

The daily digest currently has an authenticated manual send path and a production-only in-process timer. Do not treat the timer as guaranteed on Autoscale.

**Why:** Autoscaled instances may sleep at the scheduled time or run multiple instances. A separate Replit Scheduled Deployment is the reliable production mechanism for an exact daily send.

**How to apply:** If reliable 8:00 AM Asia/Colombo delivery is required, migrate the project to support a separate scheduled artifact and run a one-shot digest command there. Keep development from starting the automatic sender.