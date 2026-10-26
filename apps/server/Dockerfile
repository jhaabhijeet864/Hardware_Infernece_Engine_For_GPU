FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

RUN npm install
RUN npm --prefix packages/types run build
RUN npm --prefix packages/protocol run build
RUN npm --prefix apps/server run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

EXPOSE 3001
CMD ["npm", "--prefix", "apps/server", "run", "start"]
