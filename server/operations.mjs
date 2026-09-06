import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

// Per-instance protection. Vercel Firewall should provide distributed limits.
export function trafficGuard({
  limit = 120,
  windowMs = 60000,
  maxConcurrent = 24,
  maxClients = 10000,
  now = Date.now,
} = {}) {
  const clients = new Map();
  let active = 0;
  return (req, res, next) => {
    if (req.path === "/api/health") return next();
    const forwarded =
      process.env.VERCEL === "1"
        ? req.get("x-forwarded-for")?.split(",")[0]?.trim()
        : undefined;
    const ip =
      forwarded && isIP(forwarded)
        ? forwarded
        : req.socket.remoteAddress || "unknown";
    const time = now();
    let bucket = clients.get(ip);
    if (!bucket || bucket.reset <= time) {
      for (const [key, value] of clients)
        if (value.reset <= time) clients.delete(key);
      if (!clients.has(ip) && clients.size >= maxClients) return reject(60);
      bucket = { count: 0, reset: time + windowMs };
      clients.set(ip, bucket);
    }
    if (bucket.count >= limit)
      return reject(Math.ceil((bucket.reset - time) / 1000));
    if (active >= maxConcurrent) return reject(2);
    bucket.count++;
    active++;
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        active--;
      }
    };
    res.once("finish", release);
    res.once("close", release);
    next();
    function reject(seconds) {
      return res
        .status(429)
        .set("Retry-After", String(seconds))
        .set("Cache-Control", "no-store")
        .json({ error: "Too many requests. Please retry shortly." });
    }
  };
}

export function requestObservability(req, res, next) {
  const started = Date.now();
  const id = randomUUID();
  res.set("X-Request-Id", id);
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.on("finish", () => {
    if (res.statusCode >= 500)
      console.error(
        JSON.stringify({
          event: "request_failed",
          requestId: id,
          method: req.method,
          // Never log search text, bodies, IPs, or user-supplied identifiers.
          service: req.path.startsWith("/api")
            ? "api"
            : req.path === "/mcp"
              ? "mcp"
              : "page",
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      );
  });
  next();
}
