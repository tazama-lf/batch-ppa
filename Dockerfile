# syntax=docker/dockerfile:1
# SPDX-License-Identifier: Apache-2.0
ARG BUILD_IMAGE=node:20-bullseye
ARG RUN_IMAGE=gcr.io/distroless/nodejs20-debian11:nonroot

FROM ${BUILD_IMAGE} AS builder
LABEL stage=build
# TS -> JS stage

WORKDIR /home/app
COPY ./src ./src
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY .npmrc ./

RUN --mount=type=secret,id=GH_TOKEN,env=GH_TOKEN npm ci --ignore-scripts
RUN npm run build

FROM ${BUILD_IMAGE} AS dep-resolver
LABEL stage=pre-prod
# To filter out dev dependencies from final build

COPY package*.json ./
COPY .npmrc ./
RUN --mount=type=secret,id=GH_TOKEN,env=GH_TOKEN npm ci --omit=dev --ignore-scripts
RUN mkdir uploads

FROM ${RUN_IMAGE} AS run-env
USER nonroot

WORKDIR /home/app
COPY --from=dep-resolver /node_modules ./node_modules
COPY --from=builder /home/app/build ./build
COPY package.json ./
COPY deployment.yaml ./
COPY service.yaml ./
COPY --chown=nonroot:nonroot --from=dep-resolver /uploads ./uploads

#USER root
#RUN chmod 777 uploads
#USER nonroot


# Turn down the verbosity to default level.
ENV NPM_CONFIG_LOGLEVEL warn
ENV mode="http"
ENV upstream_url="http://127.0.0.1:3000"
ENV exec_timeout="10s"
ENV write_timeout="15s"
ENV read_timeout="15s"
ENV prefix_logs="false"

# General Variables
ENV FUNCTION_NAME=batch-ppa
ENV NODE_ENV=production
ENV MAX_CPU=1


# Batch-PPA
ENV TMS_ENDPOINT=
ENV QUOTING=true
ENV PORT=3000


# REDIS
ENV REDIS_DATABASE=0
ENV REDIS_AUTH=""
ENV REDIS_SERVERS='[{"host":"127.0.0.1", "port":6379}]'
ENV REDIS_IS_CLUSTER=false
ENV DISTRIBUTED_CACHETTL=300
ENV DISTRIBUTED_CACHE_ENABLED=true


# ArangoDB
ENV PSEUDONYMS_DATABASE=pseudonyms
ENV PSEUDONYMS_DATABASE_URL=tcp://0.0.0.0:8529
ENV PSEUDONYMS_DATABASE_USER=root
ENV PSEUDONYMS_DATABASE_PASSWORD=''
ENV PSEUDONYMS_DATABASE_CERT_PATH=''

ENV TRANSACTION_HISTORY_DATABASE=transactionHistory
ENV TRANSACTION_HISTORY_DATABASE_URL=tcp://0.0.0.0:8529
ENV TRANSACTION_HISTORY_DATABASE_USER=root
ENV TRANSACTION_HISTORY_DATABASE_PASSWORD=''
ENV TRANSACTION_HISTORY_DATABASE_CERT_PATH=''

# ELASTIC APM
ENV APM_ACTIVE=false
ENV APM_SERVICE_NAME=batch-ppa
ENV APM_URL=http://apm:8200
ENV APM_SECRET_TOKEN=""

# LOGGING
ENV LOGSTASH_HOST=logstashhost
ENV LOGSTASH_PORT=8080

# Set healthcheck command
HEALTHCHECK --interval=60s CMD [ -e /tmp/.lock ] || exit 1
EXPOSE 4222

# Execute watchdog command
CMD ["build/index.js"]
