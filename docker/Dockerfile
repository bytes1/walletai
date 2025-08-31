
FROM node:18-alpine
RUN apk add --no-cache git curl build-base bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN curl -L https://foundry.paradigm.xyz | bash
RUN foundryup
WORKDIR /usr/src/app
RUN forge init --no-deps foundry_project
WORKDIR /usr/src/app/foundry_project
RUN forge install randa-mu/blocklock-solidity
WORKDIR /usr/src/app
COPY api/package*.json ./api/
RUN cd api && npm install
COPY api/ ./api/
EXPOSE 8080
CMD ["node", "api/server.js"]

