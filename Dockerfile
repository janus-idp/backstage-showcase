# Stage 1 - Install dependencies
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS deps
USER 0

# Install yarn
RUN \
  curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo && \
  dnf install -y yarn

COPY ./package.json ./yarn.lock ./
COPY ./packages ./packages

# Remove all files except package.json
RUN find packages -mindepth 2 -maxdepth 2 \! -name "package.json" -exec rm -rf {} \+

RUN yarn install --frozen-lockfile

# Stage 2 - Build packages
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS build
USER 0

# Install yarn
RUN \
  curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo && \
  dnf install -y yarn

COPY . .
COPY --from=deps /opt/app-root/src .

RUN yarn tsc
RUN yarn build:backend

# Stage 3 - Build the actual backend image and install production dependencies
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:latest AS runner
USER 0

# Install yarn
RUN \
  curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo && \
  microdnf install -y yarn

# Install gzip for tar and clean up
RUN microdnf install -y gzip && microdnf clean all

# Switch to nodejs user
USER 1001

# Copy the install dependencies from the build stage and context
COPY --from=build /opt/app-root/src/yarn.lock /opt/app-root/src/package.json /opt/app-root/src/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# Install production dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy the built packages from the build stage
COPY --from=build /opt/app-root/src/packages/backend/dist/bundle.tar.gz .
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Copy any other files that we need at runtime
COPY ./app-config.yaml .

CMD ["node", "packages/backend", "--config", "app-config.yaml"]