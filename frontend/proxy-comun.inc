# Cabeceras comunes a todos los `location` que hacen proxy a un microservicio.
# Se incluyen en cada uno porque nginx no hereda `proxy_set_header`: basta con
# declarar una en un bloque para perder todas las heredadas.
#
# X-Real-IP y X-Forwarded-For no son cosméticas: el límite de 5 intentos de
# login por minuto es por IP, y sin ellas todas las peticiones parecerían venir
# del contenedor de nginx.
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
