# Imagem do backend no ambiente hospedado: só o runtime. O jar é compilado na
# máquina de quem publica (publicar.sh), porque a VM tem 1 GB de RAM.
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY app.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
