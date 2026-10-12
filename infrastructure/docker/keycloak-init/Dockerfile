FROM python:3.12-alpine
RUN apk add --no-cache curl bash
COPY init.sh /init.sh
COPY sync_realm.py /sync_realm.py
RUN sed -i 's/\r//' /init.sh && chmod +x /init.sh
CMD ["/init.sh"]