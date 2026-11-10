# syntax=docker/dockerfile:1
#
# Wordn00: build the static React bundle, then serve it with nginx.
# Build from the repository root so the whole project is in the context, with
# the daily-word seed passed as a build secret from the environment:
#
#   export SOLUTIONS_SHUFFLE_SEED=...
#   docker build -f deploy/Dockerfile --build-arg WORDS_DAY=$(date -u +%F) \
#     --secret id=SOLUTIONS_SHUFFLE_SEED,env=SOLUTIONS_SHUFFLE_SEED -t wordn00 .
#
# The image publishes words up to WORDS_DAY: rebuild it daily, just after
# 00:00 UTC (see deploy/README.md).
#   docker run --rm -p 8080:8080 wordn00

# Base images are pinned by digest for reproducible builds; the tag is kept
# for readability. See deploy/README.md to refresh them.

# --- build stage ------------------------------------------------------------
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS build
WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Python runs the deploy-time shuffle of the solutions into daily order.
RUN apk add --no-cache python3

COPY . .
RUN npm run build

# Words up to today (UTC), never tomorrow's. The seed is a build secret:
# it never lands in a layer or the image history, and the script fails
# without it. WORDS_DAY (UTC, YYYY-MM-DD) is part of the cache key, so a new
# day reruns this step instead of reusing yesterday's list.
ARG WORDS_DAY=
RUN --mount=type=secret,id=SOLUTIONS_SHUFFLE_SEED,env=SOLUTIONS_SHUFFLE_SEED \
    python3 scripts/shuffle_solutions.py public/words/solutions.txt build/words \
      ${WORDS_DAY:+--today "$WORDS_DAY"}

# --- runtime stage ----------------------------------------------------------
# The unprivileged image runs nginx as a non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0 AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
