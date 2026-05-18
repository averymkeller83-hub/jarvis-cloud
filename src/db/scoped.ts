import { eq, and, desc, asc, sql } from "drizzle-orm";
import { users, facts, people, pushSubscriptions } from "./schema";
import { encrypt, decrypt } from "../crypto/encrypt";
import type { Database } from "./client";

export class UserScopedDb {
  constructor(
    private db: Database,
    private userId: number,
    private encKey: string,
  ) {}

  async getProfile() {
    const rows = await this.db.select().from(users).where(eq(users.id, this.userId)).limit(1);
    return rows[0] ?? null;
  }

  async getFacts(limit = 50): Promise<{ id: number; fact: string }[]> {
    const rows = await this.db
      .select({ id: facts.id, fact: facts.fact })
      .from(facts)
      .where(eq(facts.userId, this.userId))
      .orderBy(desc(facts.createdAt))
      .limit(limit);
    const decrypted: { id: number; fact: string }[] = [];
    for (const row of rows) {
      decrypted.push({ id: row.id, fact: await decrypt(row.fact, this.encKey, this.userId) });
    }
    return decrypted;
  }

  async addFact(fact: string): Promise<void> {
    const encrypted = await encrypt(fact, this.encKey, this.userId);
    await this.db.insert(facts).values({ userId: this.userId, fact: encrypted, source: "mcp" });
  }

  async findFact(plaintext: string): Promise<{ id: number; fact: string } | null> {
    const all = await this.getFacts(200);
    return all.find((f) => f.fact === plaintext) ?? null;
  }

  async searchFacts(substring: string): Promise<{ id: number; fact: string }[]> {
    const all = await this.getFacts(200);
    const lower = substring.toLowerCase();
    return all.filter((f) => f.fact.toLowerCase().includes(lower));
  }

  async deleteFact(factId: number): Promise<boolean> {
    const row = await this.db
      .select({ id: facts.id })
      .from(facts)
      .where(and(eq(facts.id, factId), eq(facts.userId, this.userId)))
      .limit(1);
    if (!row.length) return false;
    await this.db.delete(facts).where(and(eq(facts.id, factId), eq(facts.userId, this.userId)));
    return true;
  }

  async getPeople(): Promise<{ id: number; name: string; relationship: string }[]> {
    const rows = await this.db
      .select()
      .from(people)
      .where(eq(people.userId, this.userId))
      .orderBy(asc(people.createdAt));
    const decrypted: { id: number; name: string; relationship: string }[] = [];
    for (const row of rows) {
      decrypted.push({
        id: row.id,
        name: await decrypt(row.name, this.encKey, this.userId),
        relationship: await decrypt(row.relationship ?? "", this.encKey, this.userId),
      });
    }
    return decrypted;
  }

  async findPerson(name: string): Promise<{ id: number; name: string; relationship: string } | null> {
    const all = await this.getPeople();
    const lower = name.toLowerCase();
    return all.find((p) => p.name.toLowerCase() === lower) ?? null;
  }

  async addPerson(name: string, relationship: string): Promise<void> {
    const encName = await encrypt(name, this.encKey, this.userId);
    const encRel = await encrypt(relationship, this.encKey, this.userId);
    const now = Math.floor(Date.now() / 1000);
    await this.db.insert(people).values({
      userId: this.userId,
      name: encName,
      relationship: encRel,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updatePerson(personId: number, relationship: string): Promise<void> {
    const encRel = await encrypt(relationship, this.encKey, this.userId);
    const now = Math.floor(Date.now() / 1000);
    await this.db
      .update(people)
      .set({ relationship: encRel, updatedAt: now })
      .where(and(eq(people.id, personId), eq(people.userId, this.userId)));
  }

  async deletePerson(personId: number): Promise<boolean> {
    const row = await this.db
      .select({ id: people.id })
      .from(people)
      .where(and(eq(people.id, personId), eq(people.userId, this.userId)))
      .limit(1);
    if (!row.length) return false;
    await this.db.delete(people).where(and(eq(people.id, personId), eq(people.userId, this.userId)));
    return true;
  }

  async addPushSubscription(endpoint: string, p256dh: string, auth: string): Promise<void> {
    const encP256dh = await encrypt(p256dh, this.encKey, this.userId);
    const encAuth = await encrypt(auth, this.encKey, this.userId);
    await this.db
      .insert(pushSubscriptions)
      .values({ userId: this.userId, endpoint, p256dh: encP256dh, auth: encAuth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: encP256dh, auth: encAuth, userId: this.userId },
      });
  }

  async removePushSubscription(endpoint: string): Promise<void> {
    await this.db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, this.userId)));
  }
}
