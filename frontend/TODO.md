# Frontend TODO

## Profile Picture Cropper - Auto-Zoom Issues

**Status:** Needs refinement

**Problem:** The auto-zoom calculation using `cos(θ) + sin(θ)` still doesn't perfectly prevent white space on all images at all rotation angles.

**Current Implementation:**
- Location: `src/app/profile/page.tsx:52-75`
- Formula: `minZoom = cos(angle) + sin(angle)`
- Normalizes rotation to 0-45° range

**Potential Issues:**
- May not account for different image aspect ratios (assumes square images)
- Doesn't consider actual dimensions of loaded image vs crop area
- No safety margin/buffer to ensure full coverage
- Possible mismatch with how react-easy-crop calculates rotated bounding box

**Possible Solutions:**
1. Investigate react-easy-crop library's internal zoom calculations
2. Add a small multiplier (e.g., 1.05x or 1.1x) to calculated minZoom as safety buffer
3. Calculate minZoom based on actual image dimensions and crop area size
4. Use a more sophisticated formula that accounts for rectangular (non-square) images

**Priority:** Medium - Feature works but needs improvement for edge cases

---

## Expand Frontend Test Coverage

**Status:** Future work

**Current State:**
- Location: `src/__tests__/contexts/` and `src/__tests__/lib/`
- 21 tests total: LocationContext (7), AuthContext (11), API Client (3)
- Token management and context behavior are covered
- API endpoint tests were skipped due to axios mocking complexity with Next.js

**What Needs Expansion:**

1. **API Client Endpoint Tests**
   - Mock axios properly to test all API methods (login, register, getEvents, getListings, etc.)
   - Current blocker: Jest mock hoisting conflicts with Next.js module resolution
   - Consider using `msw` (Mock Service Worker) as alternative to axios mocking

2. **Component Tests**
   - Add tests for key components: Header, EventCard, ListingCard, etc.
   - Test user interactions (clicks, form submissions)
   - Test loading and error states

3. **Page Integration Tests**
   - Test full page renders with mocked API responses
   - Verify navigation flows
   - Test authentication-protected routes

4. **Custom Hook Tests**
   - Test any custom hooks beyond context providers
   - Test WebSocket connection hooks when added to frontend

**Possible Solutions:**
1. Use `msw` (Mock Service Worker) for API mocking - more reliable than jest.mock for axios
2. Create a test utilities file with common render helpers and mock providers
3. Add snapshot tests for component UI consistency

**Priority:** Low - Core functionality is tested through backend tests and context tests. Expand as features grow.
