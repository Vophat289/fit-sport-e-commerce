FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create upload directory if it doesn't exist
RUN mkdir -p uploads

EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]