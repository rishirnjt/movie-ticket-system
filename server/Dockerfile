FROM node:22-bullseye

WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . ./

# Expose the port your server listens on
EXPOSE 5001

# Start the server
CMD ["node", "server.js"]
