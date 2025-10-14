// * Importando las dependencias necesarias
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import pkg from 'pg';

// * Inicializando la aplicación Express
const app = express();
// * Puerto de arranque del servidor
const PORT = Number(process.env.PORT) || 3000;

// * Variables de entorno para la conexión a la base de datos
const {
    DB_HOST = 'db',
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env;
const DB_PORT = Number(process.env.DB_PORT) || 5432;

// * Validación fail-fast
const missing = [];
if (!DB_USER) missing.push('DB_USER');
if (!DB_PASSWORD) missing.push('DB_PASSWORD');
if (!DB_NAME) missing.push('DB_NAME');
if (!Number.isInteger(DB_PORT) || DB_PORT <= 0) {
    console.error('DB_PORT debe ser un entero positivo');
    process.exit(1);
}
if (!Number.isInteger(PORT) || PORT <= 0) {
    console.error('PORT debe ser un entero positivo');
    process.exit(1);
}
if (missing.length) {
    console.error(`Faltan variables de entorno: ${missing.join(', ')}`);
    process.exit(1);
}

// * Configurando la conexión a la base de datos PostgreSQL
const { Pool } = pkg;
const pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
});

// * Función para crear la tabla de tareas si no existe
async function createTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
    console.log('Tabla tasks lista');
}

// * Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// * GET /tasks — Lista todas las tareas (Status 200 + array)
app.get('/tasks', async (_req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id DESC;');
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error en GET /tasks:', err.message);
        res.status(500).json({ error: 'No se obtuvo ninguna tarea...' });
    }
});

// * POST /tasks — Crea una tarea (Status 201 + objeto creado)
app.post('/tasks', async (req, res) => {
    try {
        const { title } = req.body || {};
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'El título es obligatorio y debe ser texto' });
        }
        const clean = title.trim();
        if (clean.length === 0) {
            return res.status(400).json({ error: 'El título no puede estar vacío' });
        }

        const { rows } = await pool.query(
            'INSERT INTO tasks (title) VALUES ($1) RETURNING *;',
            [clean]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error en POST /tasks:', err.message);
        res.status(500).json({ error: 'Error al crear la tarea' });
    }
});

// * PUT /tasks/:id — Actualiza el estado "completed" (Status 200 + objeto actualizado)
app.put('/tasks/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { completed } = req.body || {};
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID debe ser un entero positivo' });
        }
        if (typeof completed !== 'boolean') {
            return res.status(400).json({ error: 'El campo "completed" debe ser un valor booleano' });
        }

        const { rows } = await pool.query(
            'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *;',
            [completed, id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error en PUT /tasks/:id:', err.message);
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});

// * DELETE /tasks/:id — Elimina una tarea (Status 204 - No Content)
app.delete('/tasks/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID debe ser un entero positivo' });
        }

        const { rows } = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *;',
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
        res.status(204).send();
    } catch (err) {
        console.error('Error en DELETE /tasks/:id:', err.message);
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

// * Ruta de salud del servidor (verifica conexión a BD)
app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, db: true });
    } catch {
        res.status(500).json({ ok: false, db: false });
    }
});

// * 404 final
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// * Iniciando el servidor + migración
const start = async () => {
    try {
        await createTable();
        const server = app.listen(PORT, () => {
            console.log(`API en http://localhost:${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log('Endpoints: GET/POST /tasks, PUT/DELETE /tasks/:id');
        });
        ['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => {
            console.log(`\nRecibido ${sig}, cerrando…`);
            server.close(async () => { await pool.end(); console.log('Pool cerrado.'); process.exit(0); });
        }));
    } catch (err) {
        console.error('Error al iniciar:', err.message);
        process.exit(1);
    }
};
start();
