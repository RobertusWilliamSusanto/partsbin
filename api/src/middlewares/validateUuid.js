// Regex format UUID v1-v5 standar RFC 4122 (dipakai ulang dari projectController.js)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Middleware router.param terpusat untuk memvalidasi UUID sebelum query database
export function validateUuidParam(_req, res, next, val) {
  if (!val || typeof val !== 'string' || !UUID_REGEX.test(val.trim())) {
    return res.status(400).json({
      error: 'Format data atau UUID tidak valid.',
    });
  }
  return next();
}
