// In-memory Rate Limiting utility
const rateLimitMaps = new Map();

export function createRateLimiter({ windowMs = 60 * 1000, max = 30 } = {}) {
  const map = new Map();

  // Periodic cleanup
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of map.entries()) {
      if (now > record.resetTime) {
        map.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();

  return function checkLimit(key) {
    const now = Date.now();
    const record = map.get(key) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }
    map.set(key, record);
    return {
      allowed: record.count <= max,
      remaining: Math.max(0, max - record.count),
      resetTime: record.resetTime
    };
  };
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}
