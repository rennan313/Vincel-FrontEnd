// Default stub for local dev / `vite build` without a container.
// In the Docker image, /docker-entrypoint.d/40-generate-env.sh overwrites
// this file at container startup with the Cloud Run runtime env vars —
// Vite bakes VITE_API_URL in at build time, which can't react to a Cloud
// Run env var set after the image is built (see apiClient.ts).
window.__ENV__ = {}
