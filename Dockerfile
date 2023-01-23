# Stage 1 - Create yarn install skeleton layer
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS packages

#WORKDIR /app
COPY package.json yarn.lock ./

COPY packages packages

USER 0

RUN chgrp -R 0 /opt/app-root/src && \
  chmod -R g=u /opt/app-root/src

USER 1001

RUN npm install -g yarn && \
  fix-permissions ./ && \
  find packages -mindepth 2 -maxdepth 2 \! -name "package.json" -exec rm -rf {} \+

# Stage 2 - Install dependencies and build packages
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS build

COPY --from=packages /opt/app-root/src .

RUN fix-permissions ./ && \
  yarn install --frozen-lockfile --network-timeout 600000 && rm -rf "$(yarn cache dir)"

COPY . .

USER 0

RUN chgrp -R 0 /opt/app-root/src && \
  chmod -R g=u /opt/app-root/src

USER 1001

RUN yarn tsc
RUN yarn --cwd packages/backend build

# Stage 3 - Build the actual backend image and install production dependencies
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:latest

USER 0

RUN microdnf install -y gzip && microdnf clean all

USER 1001

# Copy the install dependencies from the build stage and context
COPY --from=build /opt/app-root/src/yarn.lock /opt/app-root/src/package.json /opt/app-root/src/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

RUN npm install -g yarn && \
  yarn install --frozen-lockfile --production --network-timeout 600000 && rm -rf "$(yarn cache dir)"

# Copy the built packages from the build stage
COPY --from=build /opt/app-root/src/packages/backend/dist/bundle.tar.gz .
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Copy any other files that we need at runtime
COPY app-config.yaml ./

RUN fix-permissions ./

CMD ["node", "packages/backend", "--config", "app-config.yaml"]