FROM node:16.14
WORKDIR /app
COPY *.json .
RUN npm install
RUN npm prune