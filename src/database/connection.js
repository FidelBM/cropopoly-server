/*
Autor:            Fidel Bonilla

El código es para concetarse a la base de datos
*/

// Importa la función createPool del paquete mysql2/promise
import { createPool } from 'mysql2/promise';

// Importa las variables de entorno que contienen la información de conexión desde el archivo de configuración config.js
import {
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_USER,
    DB_PORT
} from '../config.js';

// Crea un pool de conexiones a la base de datos utilizando la función createPool
export const pool = createPool({
    // Especifica los detalles de la conexión
    user: DB_USER,          // Nombre de usuario de la base de datos
    password: DB_PASSWORD,  // Contraseña de la base de datos
    host: DB_HOST,          // Host de la base de datos
    port: DB_PORT,          // Puerto de la base de datos
    database: DB_NAME       // Nombre de la base de datos
});
