FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl bash && rm -rf /var/lib/apt/lists/*
COPY init.sh /init.sh
RUN chmod +x /init.sh
CMD ["/init.sh"]
