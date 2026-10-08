FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY mvnw pom.xml ./
COPY .mvn ./.mvn
RUN chmod +x mvnw
COPY src ./src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /workspace/target/banking-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
