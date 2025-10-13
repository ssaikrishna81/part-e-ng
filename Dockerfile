# Build Angular app and serve with nginx
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (prefer npm ci if package-lock.json exists)
COPY package.json package-lock.json* ./
RUN npm ci --unsafe-perm || npm install --unsafe-perm

# Copy source and build
COPY . ./
# Build production bundle
RUN npm run build -- --configuration production

# Stage 2 - Nginx
FROM nginx:stable-alpine

# Copy built files. Dist output may be under /app/dist/<proj>; copying all subfolders works
COPY --from=build /app/dist/* /usr/share/nginx/html/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
