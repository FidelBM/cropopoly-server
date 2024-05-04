/*
Autor:            Fidel Bonilla

El código son los datos de conneción de la base de datos
*/

// Puerto en el que se ejecutará el servidor, obtenido de la variable de entorno PORT o por defecto el puerto 8000
export const port = process.env.PORT || 8000;

// Host de la base de datos, obtenido de la variable de entorno DB_HOST o por defecto 'localhost'
export const DB_HOST = process.env.DB_HOST || 'localhost'

// Usuario de la base de datos, obtenido de la variable de entorno DB_USER o por defecto 'root'
export const DB_USER = process.env.DB_USER || 'root'

// Contraseña de la base de datos, obtenida de la variable de entorno DB_PASSWORD o por defecto 'Nano'
export const DB_PASSWORD = process.env.DB_PASSWORD || 'Nano'

// Nombre de la base de datos, obtenido de la variable de entorno DB_NAME o por defecto 'users'
export const DB_NAME = process.env.DB_NAME || 'users'

// Puerto de la base de datos, obtenido de la variable de entorno DB_PORT o por defecto 3306
export const DB_PORT = process.env.DB_PORT || 3306
