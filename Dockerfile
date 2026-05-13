# Stage 1: Build React frontend
FROM node:26-alpine AS client-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Install server production deps (compiles better-sqlite3)
FROM node:26-alpine AS server-deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev

# Stage 3: Production runtime
FROM node:26-alpine
WORKDIR /app

COPY --from=server-deps /app/node_modules ./node_modules
COPY server/ .

COPY --from=client-builder /app/dist ./client/dist

RUN mkdir -p /app/data /app/uploads && \
    chmod +x /app/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
