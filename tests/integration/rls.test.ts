/**
 * RLS integration tests against a running Supabase local instance.
 *
 * These tests exercise the family-isolation RLS matrix: a user from
 * Family A must not be able to read or mutate rows owned by Family B
 * via the anon/authenticated role. They also assert the REVOKE rules
 * for point_transactions (I6), the completed-instance immutability
 * trigger (I7), and the global read-only catalog tables.
 *
 * Setup:
 *   - Requires a running `supabase start` local instance with the
 *     migrations applied.
 *   - Requires SUPABASE_SERVICE_SECRET_KEY in the env. Without it the
 *     whole suite is skipped cleanly (ci-friendly).
 *   - Optional: SUPABASE_URL (defaults to http://127.0.0.1:54321),
 *     SUPABASE_ANON_KEY (defaults to the CLI-printed anon key).
 *
 * Spec Section 3.2, 8. Invariants I6, I7, I10-adjacent.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_SECRET_KEY ?? "";

const runSuite = Boolean(SERVICE_KEY && ANON_KEY);

type Ctx = {
  admin: SupabaseClient;
  parentA: SupabaseClient;
  parentB: SupabaseClient;
  anon: SupabaseClient;
  familyA: string;
  familyB: string;
  parentAUser: User;
  parentBUser: User;
  childAUser: User;
  childBUser: User;
  createdUserIds: string[];
  createdFamilyIds: string[];
};

const ctx: Partial<Ctx> = { createdUserIds: [], createdFamilyIds: [] };

async function createSignedInClient(email: string, password: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`);
  return client;
}

async function seedFamily(
  admin: SupabaseClient,
  label: string,
): Promise<{ familyId: string; parent: User; child: User }> {
  const { data: fam, error: famErr } = await admin
    .from("families")
    .insert({
      name: `Fam ${label} ${Date.now()}`,
      invite_code: `RLS${label}${Math.floor(Math.random() * 1e6)
        .toString()
        .padStart(5, "0")}`.slice(0, 8),
      timezone: "Asia/Seoul",
    })
    .select("id")
    .single();
  if (famErr || !fam) throw new Error(`seed family ${label}: ${famErr?.message}`);
  ctx.createdFamilyIds!.push(fam.id);

  const parentEmail = `rls+${label.toLowerCase()}p+${Date.now()}@dooooz.test`;
  const childEmail = `rls+${label.toLowerCase()}c+${Date.now()}@dooooz.test`;
  const password = "TestPass123!";

  const { data: parent, error: pErr } =
    await admin.auth.admin.createUser({
      email: parentEmail,
      password,
      email_confirm: true,
    });
  if (pErr || !parent.user) throw new Error(`parent ${label}: ${pErr?.message}`);

  const { data: child, error: cErr } = await admin.auth.admin.createUser({
    email: childEmail,
    password,
    email_confirm: true,
  });
  if (cErr || !child.user) throw new Error(`child ${label}: ${cErr?.message}`);

  ctx.createdUserIds!.push(parent.user.id, child.user.id);

  const { error: upErr } = await admin.from("users").insert([
    {
      id: parent.user.id,
      family_id: fam.id,
      role: "parent",
      display_name: `Parent ${label}`,
    },
    {
      id: child.user.id,
      family_id: fam.id,
      role: "child",
      display_name: `Child ${label}`,
    },
  ]);
  if (upErr) throw new Error(`users rows ${label}: ${upErr.message}`);

  return { familyId: fam.id, parent: parent.user, child: child.user };
}

describe.skipIf(!runSuite)("RLS integration (Supabase local)", () => {
  beforeAll(async () => {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    ctx.admin = admin;
    ctx.anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const a = await seedFamily(admin, "A");
    const b = await seedFamily(admin, "B");

    ctx.familyA = a.familyId;
    ctx.familyB = b.familyId;
    ctx.parentAUser = a.parent;
    ctx.childAUser = a.child;
    ctx.parentBUser = b.parent;
    ctx.childBUser = b.child;

    // Sign in parents (they perform most of the assertions).
    // Admin user creation does not surface passwords, so we re-fetch by
    // re-using the known seeded password.
    ctx.parentA = await createSignedInClient(a.parent.email!, "TestPass123!");
    ctx.parentB = await createSignedInClient(b.parent.email!, "TestPass123!");
  }, 60_000);

  afterAll(async () => {
    if (!ctx.admin) return;
    for (const uid of ctx.createdUserIds ?? []) {
      await ctx.admin.auth.admin.deleteUser(uid).catch(() => {});
    }
    for (const fid of ctx.createdFamilyIds ?? []) {
      await ctx.admin.from("families").delete().eq("id", fid);
    }
  }, 60_000);

  // ------------------------------------------------------------------
  // Cross-family isolation matrix
  // ------------------------------------------------------------------
  const tables: Array<{
    name: string;
    insert: (familyId: string, ctx: Ctx) => Record<string, unknown>;
  }> = [
    {
      name: "families",
      insert: () => ({
        name: "Hacked",
        invite_code: `HAX${Math.random().toString(36).slice(2, 7)}`,
        timezone: "UTC",
      }),
    },
    {
      name: "task_templates",
      insert: (familyId, c) => ({
        family_id: familyId,
        assignee_id: c.childBUser.id,
        title: "evil task",
        points: 10,
        recurrence: { kind: "weekly", days: [0, 1, 2, 3, 4, 5, 6] },
        start_date: new Date().toISOString().slice(0, 10),
        active: true,
        created_by: c.parentAUser.id,
      }),
    },
    {
      name: "task_instances",
      insert: (familyId, c) => ({
        family_id: familyId,
        assignee_id: c.childBUser.id,
        title: "evil instance",
        points: 10,
        due_date: new Date().toISOString().slice(0, 10),
        status: "pending",
      }),
    },
    {
      name: "point_transactions",
      insert: (familyId, c) => ({
        family_id: familyId,
        user_id: c.childBUser.id,
        amount: 999,
        kind: "bonus",
        reason: "evil bonus",
        actor_id: c.parentAUser.id,
      }),
    },
    {
      name: "rewards",
      insert: (familyId) => ({
        family_id: familyId,
        title: "Evil reward",
        cost: 10,
        active: true,
      }),
    },
    {
      name: "user_badges",
      insert: (_familyId, c) => ({
        user_id: c.childBUser.id,
        badge_id: "first_step",
      }),
    },
  ];

  for (const tbl of tables) {
    it(`${tbl.name}: parentA SELECT where family_id=B → empty`, async () => {
      const c = ctx as Ctx;
      // `families` has no family_id column, so we filter by id.
      const col = tbl.name === "families" ? "id" : "family_id";
      const { data, error } = await c.parentA
        .from(tbl.name)
        .select("*")
        .eq(col, c.familyB);
      expect(error).toBeNull();
      expect(data ?? []).toEqual([]);
    });

    it(`${tbl.name}: parentA INSERT into family B → rejected`, async () => {
      const c = ctx as Ctx;
      const { error } = await c.parentA
        .from(tbl.name)
        .insert(tbl.insert(c.familyB, c));
      expect(error).not.toBeNull();
    });
  }

  // ------------------------------------------------------------------
  // I6 — point_transactions is append-only (UPDATE/DELETE REVOKEd)
  // ------------------------------------------------------------------
  it("I6: parentA cannot UPDATE their own point_transactions row", async () => {
    const c = ctx as Ctx;
    // Seed a row as service role into family A.
    const { data: seeded } = await c.admin
      .from("point_transactions")
      .insert({
        family_id: c.familyA,
        user_id: c.childAUser.id,
        amount: 5,
        kind: "bonus",
        reason: "seed",
        actor_id: c.parentAUser.id,
      })
      .select("id")
      .single();
    expect(seeded?.id).toBeTruthy();

    const { error } = await c.parentA
      .from("point_transactions")
      .update({ amount: 9999 })
      .eq("id", seeded!.id);
    expect(error).not.toBeNull();
  });

  it("I6: parentA cannot DELETE their own point_transactions row", async () => {
    const c = ctx as Ctx;
    const { data: seeded } = await c.admin
      .from("point_transactions")
      .insert({
        family_id: c.familyA,
        user_id: c.childAUser.id,
        amount: 3,
        kind: "bonus",
        reason: "seed-del",
        actor_id: c.parentAUser.id,
      })
      .select("id")
      .single();
    expect(seeded?.id).toBeTruthy();

    const { error } = await c.parentA
      .from("point_transactions")
      .delete()
      .eq("id", seeded!.id);
    expect(error).not.toBeNull();
  });

  // ------------------------------------------------------------------
  // I7 — completed task_instance is immutable
  // ------------------------------------------------------------------
  it("I7: UPDATE after completion is rejected by trigger", async () => {
    const c = ctx as Ctx;
    const today = new Date().toISOString().slice(0, 10);
    const { data: inst, error: insErr } = await c.admin
      .from("task_instances")
      .insert({
        family_id: c.familyA,
        assignee_id: c.childAUser.id,
        title: "I7 test",
        points: 10,
        due_date: today,
        status: "pending",
      })
      .select("id")
      .single();
    expect(insErr).toBeNull();
    expect(inst?.id).toBeTruthy();

    // Complete via rpc as the child (owner).
    const childClient = await createSignedInClient(
      c.childAUser.email!,
      "TestPass123!",
    );
    const { error: rpcErr } = await childClient.rpc("complete_task", {
      p_instance_id: inst!.id,
      p_actor_id: c.childAUser.id,
    });
    expect(rpcErr).toBeNull();

    // Now attempt to mutate the completed row — trigger must block it.
    const { error: updErr } = await c.parentA
      .from("task_instances")
      .update({ title: "mutated" })
      .eq("id", inst!.id);
    expect(updErr).not.toBeNull();
  });

  // ------------------------------------------------------------------
  // Global read-only catalogs
  // ------------------------------------------------------------------
  it("characters: anon can SELECT the catalog", async () => {
    const c = ctx as Ctx;
    const { data, error } = await c.anon.from("characters").select("id");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("badges: anon can SELECT the catalog", async () => {
    const c = ctx as Ctx;
    const { data, error } = await c.anon.from("badges").select("id");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});
