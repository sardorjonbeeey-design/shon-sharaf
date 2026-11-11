FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY game_server/package.json ./package.json
RUN npm install --omit=dev && npm cache clean --force
COPY game_server/src ./src
COPY game_server/db ./db
COPY game_client ./game_client
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 8080
CMD ["node","src/server.js"]
