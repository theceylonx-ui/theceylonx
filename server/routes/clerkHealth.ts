import { Router, type Request, type Response } from "express";
import { clerkClient, withAuth, requireAuth } from "../clerk";

export const clerkHealth = Router();

// Simple ping: validates server-side key can hit Clerk API
clerkHealth.get("/api/health/clerk", async (_req: Request, res: Response) => {
  try {
    const users = await clerkClient.users.getUserList({ limit: 1 });
    res.json({ ok: true, apiReachable: true, sampleUserCount: users?.data?.length ?? 0 });
  } catch (error: unknown) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Protected echo: only available when a valid session token is sent from frontend
clerkHealth.get("/api/protected/echo", requireAuth, (req: Request, res: Response) => {
  const auth = withAuth(req);
  res.json({
    ok: true,
    userId: auth.userId || 'unknown',
    sessionId: auth.sessionId || 'unknown'
  });
});