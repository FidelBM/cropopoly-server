import { Router } from "express";
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

const router = Router();

router.get("/jugadores", getJugadores);

router.post("/jugadores", postJugadores);

router.get("/jugadores/:id", getJugador);

router.delete("/jugadores/:id", deleteJugador);

router.put("/jugadores/:id", putJugador);

router.post("/jugadores/:id", crearJuego);

router.get("/jugador_completo/:id", getJugadorCompleto);

router.get("/juego_completo/:id", getJuego);

router.post("/result", createResults);

router.get("/result", getResult);

router.put("/juego/:id", putUltimoJuegoYParcelas);

router.post("/pregunta", createPreguntas);

router.get("/pregunta", getPreguntas);

router.get("/crear", createTable);


export default router;
