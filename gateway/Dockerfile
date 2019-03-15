FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

VOLUME ["/etc/ssl/gateway"]

CMD ["nginx", "-g", "daemon off;"]
