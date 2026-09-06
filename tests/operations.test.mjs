import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { trafficGuard } from "../server/operations.mjs";
function request(guard, ip = "127.0.0.1", path = "/api/awards") {
  const res = new EventEmitter();
  Object.assign(res, {
    status(n) {
      this.code = n;
      return this;
    },
    set(k, v) {
      this[k] = v;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  });
  guard(
    { path, socket: { remoteAddress: ip }, get: () => undefined },
    res,
    () => {
      res.accepted = true;
    },
  );
  return res;
}
test("Traffic limits reset, isolate clients and leave health checks available", () => {
  let time = 0;
  const guard = trafficGuard({ limit: 1, now: () => time });
  request(guard).emit("finish");
  const blocked = request(guard);
  assert.equal(blocked.code, 429);
  assert.equal(blocked["Retry-After"], "60");
  assert.ok(request(guard, "127.0.0.2").accepted);
  assert.ok(request(guard, "127.0.0.1", "/api/health").accepted);
  time = 60000;
  assert.ok(request(guard).accepted);
});
test("Concurrent work is bounded and disconnected requests release capacity once", () => {
  const guard = trafficGuard({ maxConcurrent: 1 });
  const first = request(guard);
  assert.equal(request(guard).code, 429);
  first.emit("close");
  first.emit("finish");
  const second = request(guard);
  assert.ok(second.accepted);
  assert.equal(request(guard).code, 429);
});
