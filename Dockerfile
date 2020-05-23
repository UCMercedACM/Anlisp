# base image
FROM node:12.16.1-alpine3.11

LABEL maintainer="UCM ACM Chapter"
LABEL maintainer.email="acm@ucmerced.edu"
LABEL version="0.2.0"

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json /usr/src/app

# Install dependecies
RUN yarn install --silent

# Get all the code needed to run the app
COPY . /usr/src/app

# Expose the port the app runs in
EXPOSE 4201:4201

# Serve the app
CMD ["node", "./src/index.js"]

HEALTHCHECK --interval=5m --timeout=3s \
    CMD curl -f http://localhost/ || exit 1
