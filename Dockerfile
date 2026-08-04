FROM node:alpine

WORKDIR /home/node/app

COPY package*.json ./
RUN npm install && npm cache clean --force
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY . .

RUN chown -R nodejs:nodejs /home/node/app


USER nodejs


EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
ENV NODE_ENV="docker"

CMD ["npm", "run", "dev"]
