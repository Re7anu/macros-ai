# Use Nginx Alpine image for lightweight static file serving
FROM nginx:alpine

# Copy all frontend files (html, css, js) to Nginx's default public directory
COPY frontend/ /usr/share/nginx/html/

# Expose Nginx port
EXPOSE 80
