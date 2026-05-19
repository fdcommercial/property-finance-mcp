# Multi-stage build for FDC Property Finance MCP.
# Used by Glama for validation and by anyone who wants to self-host
# the stdio server inside a container.

# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Run as non-root for safety
USER node

# Default to the stdio MCP entry point. Override CMD for HTTP transport
# (use ["node", "dist/index-http.js"] and EXPOSE 3000).
CMD ["node", "dist/index-stdio.js"]
