# syntax=docker/dockerfile:1.7

# ---------- build: the Angular app and the embeddable widget (npm run build does both)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# ---------- runtime: unprivileged nginx serving the SPA and widget.js, proxying /api
FROM nginxinc/nginx-unprivileged:1.27-alpine
ENV API_UPSTREAM=http://api:8000
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/ragdesk-web/browser /usr/share/nginx/html
EXPOSE 8080
