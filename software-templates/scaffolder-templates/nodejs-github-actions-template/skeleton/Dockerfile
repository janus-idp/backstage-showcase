# Install dependencies only when needed
FROM node:18-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
#COPY package.json yarn.lock ./
#RUN yarn install --frozen-lockfile

# If using npm with a `package-lock.json` comment out above and use below instead
COPY package.json package-lock.json ./
RUN npm ci

# Production image, copy all the files and start NodeJS
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

USER nodejs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "src/index.ts"]