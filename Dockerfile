FROM node:16.10.0

EXPOSE 3000
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY ./ ./
COPY tsconfig.json ./dashboard/

EXPOSE 3000
CMD ["npm", "start"]


