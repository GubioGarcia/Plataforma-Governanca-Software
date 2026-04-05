FROM python:3.12-alpine
RUN apk add --no-cache curl bash
COPY init.sh /init.sh
RUN chmod +x /init.sh
CMD ["/init.sh"]