/**
 * RLS regression tests.
 *
 * Verifies the role-based access model introduced by the security hardening
 * migration:
 *   - anon (unauthenticated): NO access to any operational table
 *   - staff:                  SELECT / INSERT / UPDATE, but NOT DELETE
 *   - admin:                  full CRUD, including DELETE
 *
 * These tests hit the real backend, so they need two pre-provisioned test
 * accounts and are skipped when their credentials are not provided via env:
 *
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 *   TEST_STAFF_EMAIL / TEST_STAFF_PASSWORD
 *
 * The admin account must already have the `admin` role in `public.user_roles`
 * and the staff account must have the `staff` role. Every mutation in this
 * suite uses the `boats` table (name + capacity only) and is fully self-
 * cleaning: any row it inserts is deleted before the suite exits.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const STAFF_EMAIL = process.env.TEST_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD;

const haveCreds =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  !!ADMIN_EMAIL &&
  !!ADMIN_PASSWORD &&
  !!STAFF_EMAIL &&
  !!STAFF_PASSWORD;

// All tables affected by the RLS hardening migration.
const OPERATIONAL_TABLES = [
  "divers",
  "boats",
  "dive_sites",
  "instructors",
  "dive_logs",
  "bookings",
  "accommodations",
  "emergency_procedures",
  "courses",
  "groups",
  "group_members",
  "group_itinerary",
  "waivers",
  "equipment",
  "transactions",
  "payments",
] as const;

function makeClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = makeClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return client;
}

const describeIf = haveCreds ? describe : describe.skip;

describeIf("RLS regression: role-based access control", () => {
  let anon: SupabaseClient;
  let staff: SupabaseClient;
  let admin: SupabaseClient;
  const createdBoatIds: string[] = [];

  beforeAll(async () => {
    anon = makeClient();
    staff = await signIn(STAFF_EMAIL!, STAFF_PASSWORD!);
    admin = await signIn(ADMIN_EMAIL!, ADMIN_PASSWORD!);
  });

  afterAll(async () => {
    // Best-effort cleanup as admin (only admin can DELETE).
    if (admin && createdBoatIds.length) {
      await admin.from("boats").delete().in("id", createdBoatIds);
    }
  });

  describe("anonymous access is denied on every operational table", () => {
    it.each(OPERATIONAL_TABLES)(
      "anon cannot SELECT from %s",
      async (table) => {
        const { data, error } = await anon.from(table as any).select("*").limit(1);
        // Anon should either receive an explicit RLS error or an empty
        // result set (no rows visible). Either satisfies the invariant
        // "no row leaks to unauthenticated callers".
        if (error) {
          expect(error).toBeTruthy();
        } else {
          expect(data ?? []).toEqual([]);
        }
      },
    );
  });

  describe("staff can read every operational table", () => {
    it.each(OPERATIONAL_TABLES)("staff can SELECT from %s", async (table) => {
      const { error } = await staff.from(table as any).select("id").limit(1);
      expect(error, `staff SELECT ${table}: ${error?.message}`).toBeNull();
    });
  });

  describe("admin can read every operational table", () => {
    it.each(OPERATIONAL_TABLES)("admin can SELECT from %s", async (table) => {
      const { error } = await admin.from(table as any).select("id").limit(1);
      expect(error, `admin SELECT ${table}: ${error?.message}`).toBeNull();
    });
  });

  describe("staff CRUD on boats", () => {
    it("staff can INSERT a boat", async () => {
      const { data, error } = await staff
        .from("boats")
        .insert({ name: `rls-test-staff-${Date.now()}`, capacity: 1 })
        .select("id")
        .single();
      expect(error, `staff INSERT: ${error?.message}`).toBeNull();
      expect(data?.id).toBeTruthy();
      if (data?.id) createdBoatIds.push(data.id);
    });

    it("staff can UPDATE a boat they can see", async () => {
      const id = createdBoatIds[0];
      expect(id, "prior insert must have succeeded").toBeTruthy();
      const { error } = await staff
        .from("boats")
        .update({ capacity: 2 })
        .eq("id", id);
      expect(error, `staff UPDATE: ${error?.message}`).toBeNull();
    });

    it("staff CANNOT DELETE a boat (admin-only)", async () => {
      const id = createdBoatIds[0];
      expect(id).toBeTruthy();
      // Attempt the delete.
      await staff.from("boats").delete().eq("id", id);
      // Verify (with admin) that the row still exists — the delete was a no-op
      // under RLS regardless of whether Postgres surfaced an error.
      const { data, error } = await admin
        .from("boats")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      expect(error).toBeNull();
      expect(data?.id).toBe(id);
    });
  });

  describe("admin CRUD on boats", () => {
    it("admin can INSERT a boat", async () => {
      const { data, error } = await admin
        .from("boats")
        .insert({ name: `rls-test-admin-${Date.now()}`, capacity: 1 })
        .select("id")
        .single();
      expect(error, `admin INSERT: ${error?.message}`).toBeNull();
      expect(data?.id).toBeTruthy();
      if (data?.id) createdBoatIds.push(data.id);
    });

    it("admin can DELETE a boat", async () => {
      const id = createdBoatIds[createdBoatIds.length - 1];
      expect(id).toBeTruthy();
      const { error } = await admin.from("boats").delete().eq("id", id);
      expect(error, `admin DELETE: ${error?.message}`).toBeNull();

      const { data } = await admin
        .from("boats")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      expect(data).toBeNull();

      // Remove the id we just deleted from the cleanup list.
      createdBoatIds.pop();
    });
  });

  describe("anon mutation attempts are denied", () => {
    it("anon cannot INSERT into boats", async () => {
      const { data, error } = await anon
        .from("boats")
        .insert({ name: `rls-test-anon-${Date.now()}`, capacity: 1 })
        .select("id")
        .maybeSingle();
      // Either an explicit error or a null row proves the write was rejected.
      expect(!!error || data == null).toBe(true);
    });
  });
});

if (!haveCreds) {
  describe("RLS regression: role-based access control", () => {
    it.skip("skipped — set TEST_ADMIN_EMAIL/PASSWORD and TEST_STAFF_EMAIL/PASSWORD to run", () => {
      /* documentation-only skip */
    });
  });
}
