FROM node:20-alpine AS build

WORKDIR /app

# Kopyahin ang package files
COPY package*.json ./

# I-install ang lahat ng dependencies (kasama ang devDependencies)
RUN npm install --include=dev

# Kopyahin ang buong source code
COPY . .

# Patakbuhin ang build
RUN npm run build

# Nginx stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]