# Multi-stage Dockerfile for building the Angular app and serving with nginx
# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build --if-present --silent -- --configuration production

# Stage 2: serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist/part-e-water /usr/share/nginx/html
# optional: copy custom nginx config if you have one
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;'" ]
