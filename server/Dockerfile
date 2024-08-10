# Use the official Node.js image as a base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY server/package.json server/package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the server files into the container
COPY server/ ./

# Ensure that TypeScript is compiled, and the required files are copied
RUN npm run build && npm run copy_db && npm run copy_xlsx
RUN npm rebuild sqlite3

# Expose the application's port
EXPOSE 3001

# Set the command to start the server
ENTRYPOINT ["npm", "run", "serve"]
