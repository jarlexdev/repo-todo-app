FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY index.html .
COPY app.js .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
