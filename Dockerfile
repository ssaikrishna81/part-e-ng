# Multi-stage Dockerfile for building and serving the Angular app
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
# build production artifacts into /app/dist/part-e-vaccine
RUN npm run build -- --configuration production

# Production image
FROM nginx:stable-alpine
# replace default nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# copy build output
COPY --from=build /app/dist/part-e-vaccine /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
