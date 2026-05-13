# Stage 1: Build React frontend
FROM node:26-alpine AS client-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY client/ .
RUN npm run build

# Stage 2: Install server production deps (compiles better-sqlite3)
FROM node:26-alpine AS server-deps
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && \
    apk add --no-cache python3 make g++
WORKDIR /app
COPY server/package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm_config_build_from_source=true npm install --omit=dev

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
