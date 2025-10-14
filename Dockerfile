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

# build production bundle (Angular CLI 17+ outputs to dist/<project>/browser)
RUN npm run build -- --configuration production --base-href /opal/ --deploy-url /opal/

# Stage 2: serve with nginx
FROM nginx:stable-alpine AS production

# optional: remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# copy custom nginx config to enable SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy built files from build stage
# Angular 17+ outputs browser assets under dist/<project-name>/browser
COPY --from=build /app/dist/part-e-opal/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
