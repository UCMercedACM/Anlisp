# base image
FROM node:12.16.1-alpine3.11

LABEL maintainer="UCM ACM Chapter"
LABEL maintainer.email="acm@ucmerced.edu"
LABEL version="0.2.5"

# use changes to package.json to force Docker not to use the cache
# when we change our application's angular dependencies:
COPY package.json /tmp/package.json
RUN cd /tmp && yarn install --silent
# RUN yarn global add --silent @angular/cli@8.3.14
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /app
COPY . /app

# Expose the port the app runs in
EXPOSE 4201:4201

# Serve the app
CMD ["yarn", "start"]

HEALTHCHECK --interval=5m --timeout=3s \
    CMD curl -f http://localhost/ || exit 1
