# BUILD STAGE
FROM node:12-slim AS build-stage
LABEL stage=build-stage

WORKDIR /tmp/server
COPY package.json yarn.lock ./
COPY src/client/package.json src/client/yarn.lock ./src/client/
RUN yarn install --frozen-lockfile

COPY . ./
RUN yarn && yarn build

# PROD STAGE
FROM node:12-slim AS prod-stage
RUN apt-get update && apt-get install -y procps

WORKDIR /apps/nf-data-explorer

COPY --from=build-stage /tmp/server/dist ./dist
COPY --from=build-stage /tmp/server/node_modules ./node_modules
COPY --from=build-stage /tmp/server/package.json ./package.json
COPY --from=build-stage /tmp/server/schema/discovery-schema.json ./schema/discovery-schema.json

