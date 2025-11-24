# Use Node.js LTS (Long Term Support) as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
# using ci (clean install) is better for reproducibility
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port the app runs on (NestJS default is usually 3000)
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]
