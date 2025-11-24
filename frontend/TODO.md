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
