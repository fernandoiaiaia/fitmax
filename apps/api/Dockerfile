FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN npm install -g turbo

COPY . .
RUN npm ci

# Build the api project and its dependencies
RUN turbo run build --filter=api...

# Start a new stage for a leaner final image
FROM node:22-alpine AS runner
WORKDIR /app

# Copy the built output from the builder stage
# For standard TS setup, we just need the node_modules and dist.
# In a turbo monorepo with npm workspaces, we can just copy the whole folder
# or prune it. Let's keep it simple and copy the built app.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

# Expose the port the app runs on
EXPOSE 3333

CMD ["npm", "run", "start"]
