# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
COPY env.js.template /app/env.js.template
COPY docker-entrypoint.d/40-generate-env.sh /docker-entrypoint.d/40-generate-env.sh
RUN chmod +x /docker-entrypoint.d/40-generate-env.sh

ENV PORT=8080
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
