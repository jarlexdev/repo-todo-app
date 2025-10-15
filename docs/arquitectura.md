# Arquitectura del Sistema – todo-app

## Descripción general del sistema

**todo-pp** es un sistema de gestión de tareas con tres servicios orquestados por Docker Compose:

- **frontend**: servidor **Nginx** que entrega la UI estática (HTML, CSS, JS).  
  - Contenedor escucha **:80** → expuesto en host como **http://localhost:8080**.
- **backend**: API **Node.js + Express** con endpoints REST.  
  - Escucha y se expone en **http://localhost:3000**.
- **db**: **PostgreSQL** para almacenamiento relacional.  
  - Volumen persistente `pgdata`.

## Arquitectura de componentes

[![Diagrama de arquitectura](https://drive.google.com/file/d/16-z0LNK68KCI_j2UrowVroO_mOoJLrVp/view?usp=sharing)

**Descripción breve:**
- **Frontend (Nginx)**: sirve `index.html` y recursos estáticos.
- **Backend (Express)**: expone endpoints REST (`/tasks`, `/health`), aplica validaciones y acceso a datos.
- **PostgreSQL**: almacén relacional; se usa un **Pool** de conexiones vía `pg`.

## Arquitectura de contenedores

[![Diagrama de contenedores](https://drive.google.com/file/d/19G1SA-ovkw668pdbC5HCkrQENM_l-IdP/view?usp=sharing)

**Descripción breve:**
- Los tres servicios comparten la red por defecto creada por Compose aunque se puede poner un nombre de red explicito, por ejemplo: `app-net`.
- Dentro de esa red, los contenedores se resuelven por nombre de servicios: `db`, `backend`, `frontend`
- El volumen `pgdata` asegura **persistencia** de `db` entre reinicios.

## Flujo de datos
- **Inicio del sistema (Docker Compose + healthcheck).**
    Al ejecutar docker compose up, primero se levanta el contenedor db (PostgreSQL). La base de datos ejecuta su healthcheck (pg_isready) hasta quedar en estado healthy. Solo entonces Compose inicia el backend, que se conecta a la BD y realiza un bootstrap mínimo (crea la tabla tasks si no existe). Cuando el backend ya está en marcha, se inicia el frontend (Nginx). La interfaz queda disponible en http://localhost:8080, ya sea haciendo proxy de las rutas /tasks y /health hacia backend:3000, o bien sirviendo una UI cuyo JavaScript consulta la API directamente en http://localhost:3000.

- **Listado de tareas (GET /tasks).**
    El navegador solicita la lista de tareas al frontend. Si hay proxy, Nginx reenvía la petición a backend:3000; si no lo hay, el JS del frontend hace fetch directo al backend. El backend consulta a PostgreSQL (SELECT * FROM tasks ORDER BY id DESC) y devuelve un arreglo JSON con las tareas y sus campos (id, title, completed, created_at). La UI renderiza ese resultado en pantalla.

- **Creación de tareas (POST /tasks).**
    El usuario envía un título desde la UI. La petición llega al backend (vía proxy o fetch directo). El backend valida que title sea un string no vacío y realiza un INSERT parametrizado en PostgreSQL, retornando la fila creada. La UI recibe un 201 Created con el objeto task y refresca la lista para mostrarla.

- **Actualización de estado (PUT /tasks/:id)**
    Cuando el usuario marca/desmarca una tarea, el frontend envía la petición con completed como booleano. El backend valida que el id sea un entero positivo y que completed sea boolean, actualiza el registro (UPDATE ... SET completed=...) y responde con la tarea modificada. La UI refleja el nuevo estado.

- **Eliminación (DELETE /tasks/:id).**
    Al eliminar, el frontend envía la petición con el id de la tarea. El backend valida el identificador y ejecuta el DELETE en PostgreSQL. Si la fila existía, responde 204 No Content; la UI retira la tarea de la lista. Si no existe, responde 404 Not Found.

- **Salud del sistema (GET /health).**
    Para monitoreo, el backend hace SELECT 1 a la BD: si todo está operativo, responde { ok: true, db: true } con 200; si falla la conexión o hay un error interno, responde { ok: false, db: false } con 500.

- **Persistencia.**
    Todas las operaciones de escritura (crear, actualizar, eliminar) se reflejan en PostgreSQL, cuyos datos persisten en el volumen pgdata asociado al contenedor db. Esto garantiza que los datos sobrevivan a reinicios de contenedores.

## API Endpoints
**Base URL:** `http://localhost:3000`

**GET /health**

**Descripción:** Verifica que el servicio esté arriba y que la base de datos sea accesible (consulta SELECT 1).

**Input (Request Body): —**

**Output (Response Body):**

**200 OK (servicio y BD operativos)**
```json
{ 
    "ok": true, 
    "db": true 
}
```

**GET /tasks**

**Descripción:** Obtiene todas las tareas.

**Input (Request Body): —**

**Output (Response Body):** Array de task.

**Status:** 200 OK
```json
[
  {
    "id": 1,
    "title": "Aprender Docker",
    "completed": false,
    "created_at": "2025-10-10T10:30:00Z"
  }
]
```

**POST /tasks**

**Descripción:** Crea una nueva tarea.

**Input (Request Body):**
```json
{
  "title": "Nueva tarea"
}
```
**Output (Response Body):** Objeto task creado.

**Status:** 201 Created

**PUT /tasks/:id**

**Descripción:** Actualiza el estado de una tarea.

**Input (Request Body):**
```json
{
  "completed": true
}
```
**Output (Response Body):** Objeto task actualizado.

**Status:** 200 OK

**DELETE /tasks/:id**

**Descripción:** Elimina una tarea.

**Input (Request Body): —**

**Output (Response Body): —**

**Status:** 204 No Content

## Decisiones técnicas
- **Node.js + Express** por simplicidad y ecosistema para REST.
- **PostgreSQL** por robustez y facilidad en Docker.
- **Nginx** para servir estáticos.
- **Docker Compose** para aislar servicios.
- **Validación fail-fast** de variables (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `DB_PORT`) para evitar estados inválidos.
- **Migración mínima** en runtime: creación de tabla `tasks` al iniciar (para setup rápido).

## Persistencia de datos
- **Esquema** (tabla `tasks`) crear si no existe:
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Volumen**: `pgdata → /var/lib/postgresql/data` (definido en `docker-compose.yml`).  
- **Conexión**: `pg.Pool` con `DB_HOST=db`, `DB_PORT=5432`. 

## Consideraciones de seguridad
- **Autenticación y autorización (cuando aplique):** Proteger endpoints sensibles.
- **Gestión de secretos:** Rotación periódica de credenciales.
- **TLS (certificación válida):** Servir la app detrás de un reverse proxy con HTTPS (certificados válidos, p. ej. Let’s Encrypt) y forzar HTTPS (HSTS) en producción.
- **Mínimo privilegio en la base de datos:** Usuario específico para la app, sin permisos de superusuario.
- **Actualizaciones y superficie de ataque:** Mantener imágenes base y dependencias actualizadas (parches de seguridad).
- **Backups y recuperación:** Backups programados de pgdata (pg_dump/pg_basebackup) y pruebas de restauración.

## Mejoras futuras
- **Estructura del proyecto:** Separar responsabilidades: rutas, controladores, servicios (lógica), acceso a datos (queries).
- **Frontend moderno:** Migrar UI a Vite + React y mejorar la organización de carpetas (src/components, src/pages, etc.) y build estático servido por Nginx.