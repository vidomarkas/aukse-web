# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# VITE_ vars are baked in at build time; pass via docker-compose build args
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL=/api/v1

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
