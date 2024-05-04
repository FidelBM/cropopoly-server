// Autor:      Fidel Bonilla

// Importa el enrutador de Express
import { Router } from "express";

// Importa los controladores de las funciones de manejo de solicitudes
import {
  getJugadores,
  getJugador,
  postJugadores,
  deleteJugador,
  putJugador,
  crearJuego,
  getJuego,
  createResults,
  getResult,
  putUltimoJuegoYParcelas,
  createPreguntas,
  getPreguntas,
  getJugadorCompleto,
  createTable
} from "../controllers/users.controllers.js";

// Crea una instancia de Router
const router = Router();

// Rutas para obtener, crear, actualizar y eliminar jugadores
router.get("/jugadores", getJugadores);
router.post("/jugadores", postJugadores);
router.get("/jugadores/:id", getJugador);
router.delete("/jugadores/:id", deleteJugador);
router.put("/jugadores/:id", putJugador);

// Rutas para crear y obtener información de juegos
router.post("/jugadores/:id", crearJuego);
router.get("/juego_completo/:id", getJuego);

// Rutas para crear, obtener y actualizar resultados
router.post("/result", createResults);
router.get("/result", getResult);

// Ruta para actualizar el último juego y sus parcelas
router.put("/juego/:id", putUltimoJuegoYParcelas);

// Rutas para crear, obtener y actualizar preguntas
router.post("/pregunta", createPreguntas);
router.get("/pregunta", getPreguntas);

// Ruta para obtener información completa de un jugador
router.get("/jugador_completo/:id", getJugadorCompleto);

// Ruta para crear la tabla de preguntas
router.get("/crear", createTable);

// Exporta el enrutador
export default router;
