# ================================
# Dependencies
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci


# ================================
# Builder
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ---------- PUBLIC BUILD VARIABLES ----------
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_PI_ENV
ARG NEXT_PUBLIC_PI_CLIENT_ID

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_PI_ENV=$NEXT_PUBLIC_PI_ENV
ENV NEXT_PUBLIC_PI_CLIENT_ID=$NEXT_PUBLIC_PI_CLIENT_ID

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ================================
# Runner
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs
RUN adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]