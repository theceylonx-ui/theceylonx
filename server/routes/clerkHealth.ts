import { Router } from "express";
import { clerkClient, withAuth, requireAuth } from "../clerk";

export const clerkHealth = Router();

// Simple ping: validates server-side key can hit Clerk API
clerkHealth.get("/api/health/clerk", async (_req, res: any) => {
  try {
    const users = await clerkClient.users.getUserList({ limit: 1 });
    res.json({ ok: true, apiReachable: true, sampleUserCount: users?.data?.length ?? 0 });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Protected echo: only available when a valid session token is sent from frontend
clerkHealth.get("/api/protected/echo", requireAuth, (req: any, res) => {
  res.json({
    ok: true,
    userId: req.auth?.userId || 'unknown',
    sessionId: req.auth?.sessionId || 'unknown'
  });
});