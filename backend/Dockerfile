FROM node:18

WORKDIR /app

# Copy only package.json first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Now copy the rest of the source code
COPY . .

# Start the server
CMD ["node", "index.js"]