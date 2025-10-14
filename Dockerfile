# Multi-stage Dockerfile for building and serving the Angular app
# Base deps layer
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent

# Production build
FROM deps AS build
COPY . .
RUN npm run build -- --configuration production --base-href /vaccine/ --deploy-url /vaccine/

# Development stage (optional)
FROM deps AS dev
COPY . .
EXPOSE 5632
CMD ["npm", "run", "start"]

# Production runtime
FROM nginx:stable-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/part-e-vaccine/browser/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
