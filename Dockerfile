# syntax=docker/dockerfile:1
ARG SITE_URL=http://localhost:3000
FROM node:26.13.1-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS build
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL
ENV SITE_URL=$SITE_URL NEXT_STANDALONE=1
RUN --network=none npm run build

FROM base AS runtime
ARG SITE_URL
ENV SITE_URL=$SITE_URL NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY LICENSE app/fonts/*-LICENSE.txt ./licenses/
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/sites').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
