FROM node:20-alpine

WORKDIR /app
COPY server.js ./
COPY public ./public
COPY scripts ./scripts

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data/responses

RUN addgroup -S survey && adduser -S survey -G survey \
  && mkdir -p /data/responses /data/journal \
  && chown -R survey:survey /app /data

USER survey
EXPOSE 3000

CMD ["node", "server.js"]
