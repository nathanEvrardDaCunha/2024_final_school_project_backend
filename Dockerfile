FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove devDependencies
RUN npm prune --production

EXPOSE 3000

# Add migration step
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/index.js"]