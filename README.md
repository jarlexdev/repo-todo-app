# TODO App - Sistema de Gestión de Tareas

## Descripción 
Esta es una aplicación la cual nos permite gestionar tareas de manera sencilla (crear, listar, actualizar y eliminar).

## Arquitectura
**Descripción breve:**
- **Frontend (Nginx):** sirve la interfaz (HTML/CSS/JS).
- **Backend (Node/Express):** expone la API REST `/tasks`.
- **Base de datos (PostgreSQL):** almacenamiento relacional de tareas.
- **Docker Compose:** define y conecta los servicios `frontend`, `backend` y `db` dentro de una red interna.
- **Diagrama:**

## Tecnologías 
- **Backend:** Node.js + Express + PostgreSQL 
- **Frontend:** HTML + CSS + JavaScript + Nginx 
- **Orquestación:** Docker + Docker Compose 

## Requisitos Previos 
- Docker **20+** 
- Docker Compose **2+** 
- Git

## Instalación y Ejecución

### 1. Clonar repositorio 
```bash
# usando SSH
git clone git@github.com:jarlexdev/repo-todo-app.git
# usando HTTPS
git clone https://github.com/jarlexdev/repo-todo-app.git
```

### 2. Levantar servicios
```bash 
# Construir imágenes 
docker-compose build

# Levantar servicios 
docker-compose up -d
```

### 3. Acceder a la aplicación 
- **Frontend:** `http://localhost:8080/`  
- **Backend (API):** `http://localhost:3000/tasks` 

## Comandos Útiles 
```bash 
# Construir imágenes 
docker-compose build

# Levantar servicios 
docker-compose up -d

# Ver logs de todos los servicios 
docker-compose logs -f

# Ver logs de un servicio específico 
docker-compose logs -f backend

# Detener servicios 
docker-compose down

# Detener Y eliminar volúmenes 
docker-compose down -v 

# Ver estado de servicios 
docker-compose ps
 
# Ejecutar comando en contenedor 
docker-compose exec backend sh 
```
## Estructura del Proyecto
```bash
todo-app/
├─ backend/
│  ├─ src/
│  │  └─ index.js
│  ├─ .dockerignore
│  ├─ Dockerfile
│  └─ package.json
├─ docs/
│  └─ arquitectura.md
├─ frontend/
│  ├─ Dockerfile
│  ├─ index.html
│  └─ nginx.conf
├─ .env
├─ .gitignore
├─ docker-compose.yml
└─ README.md
```

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

## Autores 
- **Estudiante 1:** _[Dennys]_ 
- **Estudiante 2:** _[Julio]_ 

## Fecha 
**Entrega:** _15/10/2025_