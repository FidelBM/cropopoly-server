/*
Autor:            Fidel Bonilla

El código son los controladores de las rutas del la base de datos
*/

import {pool} from "../database/connection.js";

// Obtener los datos de los jugadores

export const getJugadores = async (req, res) => {
    try {
        // Consulta SQL para obtener jugadores con sus juegos y parcelas
        const query = `
        SELECT 
        j.id,
        j.nombre,
        j.apellido,
        j.fechaNacimiento,
        j.genero,
        j.estado,
        j.email,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', jg.id,
                    'fechaHoraInicio', jg.fechaHoraInicio,
                    'fechaHoraFin', jg.fechaHoraFin,
                    'tipoFinanciamiento', jg.tipoFinanciamiento,
                    'noEstaciones', jg.noEstaciones,
                    'noContratos', jg.noContratos,
                    'balance', jg.balance,
                    'qytTrabajador', jg.qytTrabajador,
                    'qytHerramienta', jg.qytHerramienta,
                    'qytSemilla', jg.qytSemilla,
                    'qytAgua', jg.qytAgua,
                    'qytFertilizante', jg.qytFertilizante,
                    'Parcela', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', p.id,
                                'numeroParcela', p.numeroParcela,
                                'qytTrabajadorPar', p.qytTrabajadorPar,
                                'qytHerramientaPar', p.qytHerramientaPar,
                                'qytSemillaPar', p.qytSemillaPar,
                                'qytAguaPar', p.qytAguaPar,
                                'qytFertilizantePar', p.qytFertilizantePar,
                                'desbloqueada', p.desbloqueada,
                                'productividad', p.productividad
                            )
                        )
                        FROM Parcelas p
                        WHERE p.juego_id = jg.id
                    )
                )
            )
            FROM Juegos jg
            WHERE jg.jugador_id = j.id
        ) AS Juego
    FROM Jugadores j;
        `;
        
        // Ejecuta la consulta SQL utilizando el pool de conexiones
        const [rows, fields] = await pool.query(query);

        // Envía los resultados en formato JSON
        res.json(rows);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Agregar a los jugadores

export const postJugadores = async (req, res) => {
    const { nombre, apellido, fechaNacimiento, genero, estado, email } = req.body;

    if (!nombre || !email) {
        return res.status(400).json({ msg: "Bad Request. Please provide name and email." });
    }

    try {
        const [result] = await pool.query(`
            INSERT INTO Jugadores (nombre, apellido, fechaNacimiento, genero, estado, email)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [nombre, apellido, fechaNacimiento, genero, estado, email]);

        // MySQL doesn't support returning values on INSERT. You need to make another query.
        const [rows] = await pool.query('SELECT * FROM Jugadores WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing your request.', details: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
    }
};

// Obtener a un jugador

export const getJugador = async (req, res) => {
    try {
        // Consultar datos del jugador
        const [jugadorRows, jugadorFields] = await pool.query('SELECT * FROM Jugadores WHERE id = ?', [req.params.id]);
        const jugador = jugadorRows[0]; // Extrae el primer registro del resultado

        // Consultar juegos del jugador
        const [juegosRows, juegosFields] = await pool.query('SELECT * FROM Juegos WHERE jugador_id = ?', [req.params.id]);
        const juegos = juegosRows; // Todos los registros del resultado

        // Iterar sobre cada juego para obtener las parcelas asociadas
        for (let i = 0; i < juegos.length; i++) {
            const juegoId = juegos[i].id;
            const [parcelasRows, parcelasFields] = await pool.query('SELECT * FROM Parcelas WHERE juego_id = ?', [juegoId]);
            juegos[i].Parcela = parcelasRows; // Asigna las parcelas al juego actual
        }

        // Crear objeto de respuesta con el formato deseado
        const respuesta = {
            id: jugador.id,
            nombre: jugador.nombre,
            apellido: jugador.apellido,
            fechaNacimiento: jugador.fechaNacimiento,
            genero: jugador.genero,
            estado: jugador.estado,
            email: jugador.email,
            Juego: juegos
        };

        console.log("Respuesta:", respuesta);

        return res.json(respuesta);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Eliminar a un jugador

export const deleteJugador = async (req,res) => {
    try {
        // First, get all the games associated with the player
        const [juegos] = await pool.execute("SELECT id FROM Juegos WHERE jugador_id = ?", [req.params.id]);

        // Then, for each game, delete the associated records in the Parcelas table
        for (let juego of juegos) {
            await pool.execute("DELETE FROM Parcelas WHERE juego_id = ?", [juego.id]);
        }

        // After that, delete the associated records in the Juegos table
        await pool.execute("DELETE FROM Juegos WHERE jugador_id = ?", [req.params.id]);

        // Finally, delete the record in the Jugadores table
        const [result] = await pool.execute("DELETE FROM Jugadores WHERE id = ?", [req.params.id]);

        if (result.affectedRows === 0) return res.sendStatus(404);
        return res.sendStatus(204);
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

// Actualizar a un jugador con sus juegos y parcelas

export const putJugador = async (req, res) => {
    const { nombre, apellido, fechaNacimiento, genero, estado, email, Juego } = req.body;
    const jugadorId = req.params.id;

    if (!nombre || !apellido || !fechaNacimiento || !genero || !estado || !email || !Juego) {
        return res.status(400).json({ msg: "Bad Request. Please provide all player fields." });
    }

    try {
        const conn = await pool.getConnection();

        // Iniciar transacción
        await conn.beginTransaction();

        try {
            // Actualizar datos del jugador
            await conn.execute(
                "UPDATE Jugadores SET nombre = ?, apellido = ?, fechaNacimiento = ?, genero = ?, estado = ?, email = ? WHERE id = ?",
                [nombre, apellido, fechaNacimiento, genero, estado, email, jugadorId]
            );

            // Iterar sobre los juegos del jugador
            for (const juego of Juego) {
                // Actualizar datos del juego
                await conn.execute(
                    "UPDATE Juegos SET fechaHoraInicio = ?, fechaHoraFin = ?, tipoFinanciamiento = ?, noEstaciones = ?, noContratos = ?, balance = ?, qytTrabajador = ?, qytHerramienta = ?, qytSemilla = ?, qytAgua = ?, qytFertilizante = ? WHERE id = ?",
                    [juego.fechaHoraInicio, juego.fechaHoraFin, juego.tipoFinanciamiento, juego.noEstaciones, juego.noContratos, juego.balance, juego.qytTrabajador, juego.qytHerramienta, juego.qytSemilla, juego.qytAgua, juego.qytFertilizante, juego.id]
                );

                // Iterar sobre las parcelas del juego
                for (const parcela of juego.Parcela) {
                    // Actualizar datos de la parcela
                    await conn.execute(
                        "UPDATE Parcelas SET numeroParcela = ?, qytTrabajadorPar = ?, qytHerramientaPar = ?, qytSemillaPar = ?, qytAguaPar = ?, qytFertilizantePar = ?, desbloqueada = ?, productividad = ? WHERE id = ?",
                        [parcela.numeroParcela, parcela.qytTrabajadorPar, parcela.qytHerramientaPar, parcela.qytSemillaPar, parcela.qytAguaPar, parcela.qytFertilizantePar, parcela.desbloqueada, parcela.productividad, parcela.id]
                    );
                }
            }

            // Confirmar transacción
            await conn.commit();
        } catch (error) {
            // Revertir transacción en caso de error
            await conn.rollback();

            // Enviar respuesta de error
            return res.status(500).send(error.message);
        } finally {
            // Liberar la conexión
            conn.release();
        }

        // Responder con los datos actualizados
        res.json({
            id: jugadorId,
            nombre,
            apellido,
            fechaNacimiento,
            genero,
            estado,
            email,
            Juego
        });
    } catch (error) {
        // Enviar respuesta de error
        res.status(500).send(error.message);
    }
};

// Juegos

// Crear juego
export const crearJuego = async (req, res) => {
    try {
        const { 
            fechaHoraInicio = 0, 
            fechaHoraFin = 0, 
            tipoFinanciamiento = 0, 
            noEstaciones = 0, 
            noContratos = 0, 
            balance = 0, 
            qytTrabajador = 0, 
            qytHerramienta = 0, 
            qytSemilla = 0, 
            qytAgua = 0, 
            qytFertilizante = 0 
        } = req.body;
        // Paso 1: Obtener el ID del jugador
        const [jugadorExistente] = await pool.query("SELECT * FROM Jugadores WHERE id = ?", [req.params.id]);
        
        if (jugadorExistente.length === 0) {
            return res.status(404).json({ message: "El jugador especificado no existe." });
        }
        
        const [juegoResult] = await pool.query(`
            INSERT INTO Juegos (jugador_id, fechaHoraInicio, fechaHoraFin, tipoFinanciamiento, noEstaciones, noContratos, balance, qytTrabajador, qytHerramienta, qytSemilla, qytAgua, qytFertilizante)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [req.params.id, fechaHoraInicio, fechaHoraFin, tipoFinanciamiento, noEstaciones, noContratos, balance, qytTrabajador, qytHerramienta, qytSemilla, qytAgua, qytFertilizante]);
        
        const juegoId = juegoResult.insertId;

        // Paso 3: Insertar cuatro tablas de parcelas asociadas al juego
        for (let i = 1; i <= 5; i++) {
            await pool.query(`
                INSERT INTO Parcelas (juego_id, numeroParcela, qytTrabajadorPar, qytHerramientaPar, qytSemillaPar, qytAguaPar, qytFertilizantePar, desbloqueada, productividad)
                VALUES (?, ?, 0, 0, 0, 0, 0, 'false', 0);
            `, [juegoId, i]);
        }

        return res.status(201).json({ message: "Juego creado exitosamente." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Obtener juego

export const getJuego = async (req, res) => {
    try {
        const { id } = req.params; // Asume que el id se pasa como un parámetro de ruta
        const [rows] = await pool.query("SELECT * FROM Juegos WHERE id = ?", [id]);
        if (rows.length > 0) {
            return res.json(rows[0]);
        } else {
            return res.status(404).json({ message: "No game found with this id" });
        }
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

// Resultado 
// Crear resultado del login o registro
export const createResults = async (req, res) => {
    const { email } = req.body;
  
    if (email == null ) {
      return res.status(400).json({ msg: "Bad Request. Please fill all fields" });
    }
  
    try {
      const result = await pool.query(
        "INSERT INTO Resultados (email) VALUES (?)", [email]
      );
  
      res.json({
        email,
        id: result[0].insertId,
      });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }
};

// Obtener el resultado del login
export const getResult = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Resultados");
        res.json(rows);
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

// Agregar juego y parcelas de un jugador

  export const putUltimoJuegoYParcelas = async (req, res) => {
    
    const { fechaHoraInicio, fechaHoraFin, tipoFinanciamiento, noEstaciones, noContratos, balance, qytTrabajador, qytHerramienta, qytSemilla, qytAgua, qytFertilizante } = req.body;
 



    try {

        const transaction = pool.transaction();

        await transaction.begin();

        const juegoId = req.params.id; 

        const juegoResult = await transaction
            .request()
            .input("id", sql.Int, juegoId)
            .input("fechaHoraInicio", sql.VarChar(50), fechaHoraInicio)
            .input("fechaHoraFin", sql.VarChar(50), fechaHoraFin)
            .input("tipoFinanciamiento", sql.VarChar(50), tipoFinanciamiento)
            .input("noEstaciones", sql.Int, noEstaciones)
            .input("noContratos", sql.Int, noContratos)
            .input("balance", sql.Int, balance)
            .input("qytTrabajador", sql.Int, qytTrabajador)
            .input("qytHerramienta", sql.Int, qytHerramienta)
            .input("qytSemilla", sql.Int, qytSemilla)
            .input("qytAgua", sql.Int, qytAgua)
            .input("qytFertilizante", sql.Int, qytFertilizante)
            .query(`
                UPDATE Juegos 
                SET fechaHoraInicio = @fechaHoraInicio, 
                    fechaHoraFin = @fechaHoraFin, 
                    tipoFinanciamiento = @tipoFinanciamiento, 
                    noEstaciones = @noEstaciones, 
                    noContratos = @noContratos, 
                    balance = @balance, 
                    qytTrabajador = @qytTrabajador, 
                    qytHerramienta = @qytHerramienta, 
                    qytSemilla = @qytSemilla, 
                    qytAgua = @qytAgua, 
                    qytFertilizante = @qytFertilizante
                WHERE id = @id
            `);


        for (const parcela of Juego.Parcela) {

            const parcelaResult = await transaction
                .request()
                .input("id", sql.Int, parcela.id)
                .input("numeroParcela", sql.Int, parcela.numeroParcela)
                .input("qytTrabajadorPar", sql.Int, parcela.qytTrabajadorPar)
                .input("qytHerramientaPar", sql.Int, parcela.qytHerramientaPar)
                .input("qytSemillaPar", sql.Int, parcela.qytSemillaPar)
                .input("qytAguaPar", sql.Int, parcela.qytAguaPar)
                .input("qytFertilizantePar", sql.Int, parcela.qytFertilizantePar)
                .input("desbloqueada", sql.VarChar(50), parcela.desbloqueada)
                .input("productividad", sql.Int, parcela.productividad)
                .query(`
                    UPDATE Parcelas
                    SET numeroParcela = @numeroParcela, 
                        qytTrabajadorPar = @qytTrabajadorPar,
                        qytHerramientaPar = @qytHerramientaPar,
                        qytSemillaPar = @qytSemillaPar,
                        qytAguaPar = @qytAguaPar,
                        qytFertilizantePar = @qytFertilizantePar,
                        desbloqueada = @desbloqueada,
                        productividad = @productividad
                    WHERE id = @id
                `);
            if (parcelaResult.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(404).json({ msg: `Parcel with ID ${parcela.id} not found.` });
            }
        }

        await transaction.commit();

        res.json({
            juegoResult
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Preguntas

// Obtener las preguntas hechaes en un juego

export const getPreguntas = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Preguntas");
        res.json(rows);
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

  export const createPreguntas = async (req, res) => {
    const { juego_id, pregunta, respuesta, correcta } = req.body;
  
    if (juego_id == null) {
      return res.status(400).json({ msg: "Bad Request. Please fill all fields" });
    }
  
    try {
      const result = await pool.query(
        "INSERT INTO Preguntas (juego_id, pregunta, respuesta, correcta) VALUES (?, ?, ?, ?)", 
        [juego_id, pregunta, respuesta, correcta]
      );
  
      res.json({
        juego_id,
        pregunta,
        respuesta,
        correcta,
        id: result[0].insertId,
      });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }
};

// Obtener el jugador completo

export const getJugadorCompleto = async (req, res) => {
    try {
        // Consultar datos del jugador
        const [jugadorResult] = await pool.query("SELECT * FROM Jugadores WHERE id = ?", [req.params.id]);
        
        // Consultar juegos del jugador
        const [juegosResult] = await pool.query("SELECT * FROM Juegos WHERE jugador_id = ?", [req.params.id]);
        
        // Datos del jugador
        const jugador = jugadorResult[0];
        // Juegos del jugador
        const juegos = juegosResult;

        // Iterar sobre cada juego para obtener las parcelas y preguntas asociadas
        for (let i = 0; i < juegos.length; i++) {
            const juegoId = juegos[i].id;
            
            // Consultar parcelas del juego
            const [parcelasResult] = await pool.query("SELECT * FROM Parcelas WHERE juego_id = ?", [juegoId]);

            // Asignar las parcelas al juego actual
            juegos[i].Parcela = parcelasResult;

            // Consultar preguntas del juego
            const [preguntasResult] = await pool.query("SELECT * FROM Preguntas WHERE juego_id = ?", [juegoId]);

            // Asignar las preguntas al juego actual
            juegos[i].Preguntas = preguntasResult;
        }

        // Crear objeto de respuesta con el formato deseado
        const respuesta = {
            id: jugador.id,
            nombre: jugador.nombre,
            apellido: jugador.apellido,
            fechaNacimiento: jugador.fechaNacimiento,
            genero: jugador.genero,
            estado: jugador.estado,
            email: jugador.email,
            Juego: juegos
        };

        console.log("Respuesta:", respuesta);

        return res.json(respuesta);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Crear una tabla
export const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE Preguntas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                juego_id INT,
                pregunta VARCHAR(50),
                respuesta VARCHAR(200),
                correcta VARCHAR(50),
                FOREIGN KEY (juego_id) REFERENCES Juegos(id)
            )
        `);
        console.log("Table Preguntas created successfully");
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};
