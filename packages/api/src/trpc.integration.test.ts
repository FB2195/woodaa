import { db } from "@woodaa/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./router";
import { resetTestDb } from "./testDb";

// Admin accounts must have 2FA enabled before any adminProcedure call
// succeeds (see the isAdmin middleware in trpc.ts) - verified here against
// the real router/DB rather than just the middleware in isolation, since
// what actually matters is that a real admin request is blocked.
describe("adminProcedure requires 2FA", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  async function createAdmin(twoFactorEnabled: boolean) {
    return db.user.create({
      data: {
        email: `admin-${crypto.randomUUID()}@example.test`,
        passwordHash: "irrelevant-for-this-test",
        name: "Test Admin",
        role: "ADMIN",
        twoFactorEnabled,
      },
    });
  }

  it("rejects an admin request when 2FA is not enabled", async () => {
    const admin = await createAdmin(false);
    const caller = appRouter.createCaller({
      db,
      user: { id: admin.id, role: "ADMIN" },
      ip: null,
    });

    await expect(caller.admin.pendingFacilities()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows an admin request once 2FA is enabled", async () => {
    const admin = await createAdmin(true);
    const caller = appRouter.createCaller({
      db,
      user: { id: admin.id, role: "ADMIN" },
      ip: null,
    });

    await expect(caller.admin.pendingFacilities()).resolves.toBeDefined();
  });

  it("still rejects a non-admin regardless of 2FA status", async () => {
    const user = await db.user.create({
      data: {
        email: `searcher-${crypto.randomUUID()}@example.test`,
        passwordHash: "irrelevant-for-this-test",
        name: "Test Suchende",
        role: "SUCHENDE",
        twoFactorEnabled: true,
      },
    });
    const caller = appRouter.createCaller({
      db,
      user: { id: user.id, role: "SUCHENDE" },
      ip: null,
    });

    await expect(caller.admin.pendingFacilities()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

// Same requirement, same reasoning, for BETREIBER accounts - an operator
// sees every Suchende's Sozialdaten who books or messages their facility,
// so this isn't opt-in either (see the isOperator middleware in trpc.ts).
describe("operatorProcedure requires 2FA", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  async function createOperator(twoFactorEnabled: boolean) {
    return db.user.create({
      data: {
        email: `operator-${crypto.randomUUID()}@example.test`,
        passwordHash: "irrelevant-for-this-test",
        name: "Test Betreiber",
        role: "BETREIBER",
        twoFactorEnabled,
      },
    });
  }

  it("rejects an operator request when 2FA is not enabled", async () => {
    const operator = await createOperator(false);
    const caller = appRouter.createCaller({
      db,
      user: { id: operator.id, role: "BETREIBER" },
      ip: null,
    });

    await expect(caller.operator.myFacility()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows an operator request once 2FA is enabled", async () => {
    const operator = await createOperator(true);
    const caller = appRouter.createCaller({
      db,
      user: { id: operator.id, role: "BETREIBER" },
      ip: null,
    });

    await expect(caller.operator.myFacility()).resolves.toBeNull();
  });
});
