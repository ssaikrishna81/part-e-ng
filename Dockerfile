# Multi-stage Dockerfile for Angular (build with Node, serve with nginx)
# Stage 1: build the Angular app
FROM node:20-alpine AS build
WORKDIR /app

# copy package manifests first for better layer caching
COPY package.json package-lock.json ./

# install dependencies (use npm ci to respect lockfile)
RUN npm ci --silent

# copy full project
COPY . .

# build production bundle (angular.json defaultConfiguration = production)
RUN npm run build --silent

# Stage 2: serve with nginx
FROM nginx:stable-alpine AS production

# optional: remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# copy custom nginx config to enable SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy built files from build stage
# adjust path to your angular output folder (dist/<project-name>)
COPY --from=build /app/dist/part-e-opal /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
