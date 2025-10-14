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
FROM nginx:stable-alpine AS production

# Copy built files. Dist output may be under /app/dist/<proj>; copying all subfolders works
## Copy the built app into nginx html root.
## Angular outputs into dist/<project-name> (e.g. dist/part-e-home).
## Copy that subfolder's contents into nginx html so index.html is at /usr/share/nginx/html/index.html
## Angular sometimes outputs a 'browser' subfolder inside dist/<project>.
## Copy the browser/* contents if present so index.html is at the nginx root.
COPY --from=build /app/dist/part-e-home/browser/ /usr/share/nginx/html/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
