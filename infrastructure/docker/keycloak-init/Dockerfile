FROM python:3.12-alpine
RUN apk add --no-cache curl bash
COPY init.sh /init.sh
RUN sed -i 's/\r//' /init.sh && chmod +x /init.sh
CMD ["/init.sh"]