/*
Autor:            Fidel Bonilla

El código es el uso de las librerias para crear la coneccion a la base de datos
*/

// Importa Express para crear y configurar el servidor web
import express from 'express';

// Importa las rutas definidas para las operaciones CRUD de los usuarios
import userRoutes from './routes/users.routes.js';

// Importa el middleware para habilitar el intercambio de recursos entre servidores
import cors from "cors";

// Importa el middleware para registrar las solicitudes HTTP en la consola
import morgan from "morgan";

// Crea una instancia de la aplicación Express
const app = express();

// Habilita el middleware para permitir el intercambio de recursos entre servidores
app.use(cors());

// Habilita el middleware para registrar las solicitudes HTTP en la consola en formato "dev"
app.use(morgan("dev"));

// Habilita el middleware para analizar las solicitudes entrantes con datos codificados en URL
app.use(express.urlencoded({ extended: false }));

// Habilita el middleware para analizar las solicitudes entrantes con datos en formato JSON
app.use(express.json());

// Utiliza las rutas definidas en userRoutes para gestionar las solicitudes relacionadas con los usuarios
app.use(userRoutes);

// Exporta la aplicación Express configurada
export default app;
