import { getDb } from "../db/client";
import { proactiveJobs } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Env } from "../types";
import type { ProactiveJobType } from "./types";

export interface DueJob {
  id: number;
  jobType: ProactiveJobType;
  config: Record<string, unknown>;
}

export async function getDueJobs(env: Env): Promise<DueJob[]> {
  const db = getDb(env.DB);
  const now = Math.floor(Date.now() / 1000);

  const jobs = await db
    .select()
    .from(proactiveJobs)
    .where(eq(proactiveJobs.enabled, 1))
    .all();

  return jobs
    .filter((j) => {
      if (!j.lastRunAt) return true;
      const nextRun = j.lastRunAt + j.intervalHours * 3600;
      return now >= nextRun;
    })
    .map((j) => ({
      id: j.id,
      jobType: j.jobType as ProactiveJobType,
      config: j.config ? JSON.parse(j.config) : {},
    }));
}

export async function markJobRan(env: Env, jobId: number): Promise<void> {
  const db = getDb(env.DB);
  const now = Math.floor(Date.now() / 1000);
  await db
    .update(proactiveJobs)
    .set({ lastRunAt: now })
    .where(eq(proactiveJobs.id, jobId))
    .run();
}
