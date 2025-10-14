# Imagen base optimizada
FROM node:20-alpine
# Establecer el directorio de trabajo
WORKDIR /app
# Copiar solo los archivos necesarios para instalar dependencias
COPY package*.json ./
# Instalar dependencias de producción
RUN npm i --omit=dev || npm ci --omit=dev
# Copiar código fuente
COPY src ./src
# Variables de entorno y comando de inicio
ENV NODE_ENV=production
# Exponer el puerto
EXPOSE 3000
# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]