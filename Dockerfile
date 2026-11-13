# Imagen de despliegue: compila Angular, empaqueta Spring Boot y ejecuta un solo servicio.

# 1) Frontend Angular -> src/main/resources/static
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npx ng build

# 2) Backend Spring Boot (incluye el build de Angular como recursos estáticos)
FROM eclipse-temurin:25-jdk AS backend
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY src src
COPY --from=frontend /app/src/main/resources/static src/main/resources/static
RUN ./mvnw -q package -DskipTests

# 3) Ejecución
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080
# JWT_SECRET y STAFF_PASSWORD deben definirse como variables de entorno del servicio.
ENTRYPOINT ["java", "-jar", "app.jar"]
