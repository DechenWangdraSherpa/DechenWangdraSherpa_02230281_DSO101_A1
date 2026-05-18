FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Clean install dependencies
RUN npm ci || npm install

# Copy rest of code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]