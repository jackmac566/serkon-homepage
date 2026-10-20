import assert from "node:assert/strict";
import test from "node:test";
import {
  adminSessionTicket,
  isAdminCredential,
  parseDeviceId,
  signDeviceId,
} from "../app/device-identity.ts";

const DEVICE_ID = "50c4ef0d-9530-47ea-a32a-51bb1cd7c381";
const DEVICE_SECRET = "test-only-device-secret";
const ADMIN_SECRET = "test-only-admin-secret";

for (const adminBinding of ["ADMIN_KEY", "ADMIN_TOKEN"]) {
  test(`${adminBinding} authorizes administrators independently of DEVICE_SECRET`, async () => {
    const env = { DEVICE_SECRET, [adminBinding]: ADMIN_SECRET };

    assert.equal(await isAdminCredential(ADMIN_SECRET, env), true);
    assert.equal(await isAdminCredential(DEVICE_SECRET, env), false);
    assert.equal(await isAdminCredential(await adminSessionTicket(env), env), true);

    const deviceCookie = await signDeviceId(DEVICE_ID, env);
    assert.equal(await parseDeviceId(deviceCookie, { DEVICE_SECRET }), DEVICE_ID);
    assert.equal(await parseDeviceId(deviceCookie, { [adminBinding]: ADMIN_SECRET }), null);
    assert.equal(await isAdminCredential(deviceCookie, env), false);
  });

  test(`${adminBinding} remains a device-signing fallback when DEVICE_SECRET is absent`, async () => {
    const env = { [adminBinding]: ADMIN_SECRET };
    const cookie = await signDeviceId(DEVICE_ID, env);

    assert.equal(await parseDeviceId(cookie, env), DEVICE_ID);
    assert.equal(await isAdminCredential(ADMIN_SECRET, env), true);
  });
}

test("device-secret rotation preserves admin tickets; admin-secret rotation revokes them", async () => {
  const env = { DEVICE_SECRET, ADMIN_KEY: ADMIN_SECRET };
  const ticket = await adminSessionTicket(env);

  const deviceRotated = { ...env, DEVICE_SECRET: "rotated-test-device-secret" };
  assert.equal(await adminSessionTicket(deviceRotated), ticket);
  assert.equal(await isAdminCredential(ticket, deviceRotated), true);
  assert.equal(await isAdminCredential(ticket, { ...env, ADMIN_KEY: "rotated-test-admin-secret" }), false);
});

test("a device secret alone never grants administrator access", async () => {
  const env = { DEVICE_SECRET };

  assert.equal(await isAdminCredential(DEVICE_SECRET, env), false);
  assert.equal(await isAdminCredential(await adminSessionTicket(env), env), false);
  assert.equal(await isAdminCredential("", env), false);
});
