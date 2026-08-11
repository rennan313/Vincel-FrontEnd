#!/bin/sh
# Runs automatically at container start (nginx's base image executes every
# *.sh file in this directory before starting nginx) — writes the real
# runtime VITE_API_URL over the build-time stub in public/env.js, since
# Vite bakes import.meta.env.VITE_API_URL in at `vite build` time and can't
# see a Cloud Run env var set on the running service afterwards.
set -eu

envsubst '${VITE_API_URL}' < /app/env.js.template > /usr/share/nginx/html/env.js
