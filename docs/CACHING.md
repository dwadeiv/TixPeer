# TixPeer Caching Strategy

**Last Updated:** 2025-11-24

This document describes the HTTP caching strategy implemented for TixPeer to balance performance and data freshness.

## Overview

TixPeer uses **HTTP cache headers** with `stale-while-revalidate` to provide excellent performance while ensuring users see reasonably fresh data. This approach avoids the complexity of Redis/Memcached until traffic patterns justify it.

## Current Implementation

### Backend Cache Headers

All public GET endpoints return cache headers controlled by the backend. The frontend does not send aggressive `no-cache` headers, allowing browser and CDN caching to work naturally.

#### Events Endpoints

**GET `/events`** - List all events
```
Cache-Control: public, max-age=60, stale-while-revalidate=300
```
- **Rationale:** Events don't change frequently (new events are added occasionally)
- **TTL:** 60 seconds fresh, up to 5 minutes stale
- **Impact:** Multiple users see same cached response within 60 seconds

**GET `/events/:id`** - Single event details
```
Cache-Control: public, max-age=30, stale-while-revalidate=300
```
- **Rationale:** Event details include listing counts which change more frequently
- **TTL:** 30 seconds fresh, up to 5 minutes stale
- **Impact:** Reduced database load for popular events

#### Listings Endpoints

**GET `/listings`** - List all listings
```
Cache-Control: public, max-age=30, stale-while-revalidate=300
```
- **Rationale:** Active marketplace with frequent updates (new listings, status changes)
- **TTL:** 30 seconds fresh, up to 5 minutes stale
- **Impact:** Balance between freshness and performance

**GET `/listings/:id`** - Single listing details
```
Cache-Control: public, max-age=30, stale-while-revalidate=300
```
- **Rationale:** Listing details may change as users interact (status, availability)
- **TTL:** 30 seconds fresh, up to 5 minutes stale
- **Impact:** Immediate response for users viewing same listing

### How stale-while-revalidate Works

`stale-while-revalidate=300` means:
1. **Within TTL (30-60s):** Serve from cache, don't hit backend
2. **After TTL, within 5 minutes:**
   - Serve stale cache immediately (zero latency for user)
   - Fetch fresh data in background
   - Next request gets fresh data
3. **After 5 minutes:** Cache expired, fetch fresh data (user waits)

**User Experience:** Feels instant because stale cache served immediately while background refresh happens.

## Files Modified

### Backend Controllers

**`backend/src/events/events.controller.ts`**
- Added `@Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')` to GET `/events`
- Added `@Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')` to GET `/events/:id`
- Removed old `no-store, no-cache` headers

**`backend/src/listings/listings.controller.ts`**
- Added `@Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')` to GET `/listings`
- Added `@Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')` to GET `/listings/:id`
- Removed old `no-store, no-cache` headers

### Frontend API Client

**`frontend/src/lib/api.ts`**
- Removed aggressive cache-busting headers from axios client
- Backend now controls caching via response headers
- Client respects standard HTTP caching behavior

## Performance Benefits

### Development
- Multiple developers hitting same endpoints = shared cache
- Faster page loads during development
- Reduced database queries

### Production (Expected)
- **100 users/minute hitting homepage:**
  - Without cache: 100 database queries/minute
  - With cache (60s TTL): ~2 database queries/minute
  - **50x reduction in database load**

- **stale-while-revalidate:**
  - Zero perceived latency for users
  - Background refresh keeps data fresh
  - No "loading" spinners after initial page load

## Trade-offs

### What We Gained
✅ Significantly reduced database load
✅ Faster response times for users
✅ CDN-ready (cache headers work with CloudFlare, Cloudfront, etc.)
✅ Simple implementation (no Redis to manage)
✅ Easy to tune (just change TTL values)

### What We Accept
⚠️ Data up to 30-60 seconds old (imperceptible to users)
⚠️ New listings may take 30s to appear for all users
⚠️ Not suitable for real-time features (use WebSockets for those)

## Future Enhancements (When Needed)

### When to Add Redis/Memcached

**DO NOT add Redis prematurely.** Only implement Redis when you have **actual usage data** showing:

1. **Slow endpoints** - Response times degrading (p95/p99 latency increasing)
2. **Database under load** - High CPU/memory usage, slow queries, connection pool exhaustion
3. **Latency complaints** - Users reporting slow page loads or timeouts

**Why wait:**
- HTTP caching already provides significant performance gains
- Redis adds operational complexity (deployment, monitoring, maintenance)
- Without real traffic data, you're optimizing blindly
- Premature optimization wastes development time

**The right approach:** Monitor production metrics, identify specific slow endpoints, then add targeted Redis caching for those paths. The work becomes targeted and worthwhile.

### Add Redis/Memcached Layer
**When:** You see the warning signs above (slow endpoints, DB load, complaints)

**How:**
1. Install Redis: `npm install redis`
2. Wrap service methods with cache decorator
3. Keep HTTP cache headers (CDN still benefits)
4. Implement cache invalidation on mutations

**Example:**
```typescript
// In listings.service.ts
async findAll(): Promise<Listing[]> {
  const cacheKey = 'listings:all';

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss - fetch from database
  const listings = await this.listingRepository.find();

  // Store in cache for 30 seconds
  await redis.setex(cacheKey, 30, JSON.stringify(listings));

  return listings;
}
```

### Cache Invalidation
**When:** Need instant updates for specific actions

**Scenarios:**
- New listing created → invalidate `listings:all` cache
- Event updated → invalidate `events:{id}` cache
- Listing sold → invalidate `listings:{id}` and `events:{eventId}` cache

**Implementation:**
```typescript
// In listings.service.ts
async create(data: CreateListingDto): Promise<Listing> {
  const listing = await this.listingRepository.save(data);

  // Invalidate relevant caches
  await redis.del('listings:all');
  await redis.del(`events:${listing.eventId}`);

  return listing;
}
```

### Per-Endpoint Tuning
**When:** Traffic patterns show different caching needs

**Approach:**
1. Monitor cache hit rates per endpoint
2. Identify high-traffic endpoints with low hit rates
3. Adjust TTL values based on data
4. Use longer TTL for rarely-changing data (venue info, past events)
5. Use shorter TTL for frequently-changing data (active listings)

## Verification

### Check Cache Headers
```bash
# Events endpoint
curl -I http://localhost:3001/events | grep -i cache
# Output: Cache-Control: public, max-age=60, stale-while-revalidate=300

# Listings endpoint
curl -I http://localhost:3001/listings | grep -i cache
# Output: Cache-Control: public, max-age=30, stale-while-revalidate=300
```

### Test Caching Behavior
```bash
# First request - cache miss (hits database)
time curl -s http://localhost:3001/events > /dev/null

# Second request within 60s - cache hit (no database query)
time curl -s http://localhost:3001/events > /dev/null

# Second request should be faster
```

## Best Practices

### DO ✅
- Use HTTP cache headers for public, non-sensitive data
- Use `stale-while-revalidate` for better UX
- Let backend control caching via response headers
- Structure code so services can be wrapped in caching later
- Monitor cache hit rates in production
- Adjust TTL values based on real traffic patterns

### DON'T ❌
- Don't cache authenticated endpoints without `private` directive
- Don't cache sensitive user data (use `Cache-Control: private, no-cache`)
- Don't set aggressive `no-cache` headers from frontend
- Don't implement Redis until you have traffic data to justify it
- Don't over-engineer caching before you have performance problems

## Monitoring (Future)

When traffic increases, monitor:
- Cache hit rate per endpoint
- Database query frequency
- Response time p50, p95, p99
- Memory usage (when Redis added)
- Cache invalidation rate

**Tools:** DataDog, New Relic, or custom logging with Prometheus

## Summary

**Current State:**
- Simple HTTP caching with sensible TTLs
- `stale-while-revalidate` for zero perceived latency
- Ready for production with good performance
- Easy to enhance with Redis when needed

**Scaling Path:**
1. ✅ HTTP cache headers (done)
2. → Add Redis when traffic justifies it
3. → Implement cache invalidation
4. → Fine-tune TTLs based on data
5. → Add CDN layer (CloudFlare/Cloudfront)

**Philosophy:** Start simple, scale based on real needs.
