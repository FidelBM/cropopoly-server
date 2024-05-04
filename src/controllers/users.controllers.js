// Importar el objeto 'pool' del archivo de conexión a la base de datos
import { pool } from "../database/connection.js";

// Función para obtener todos los jugadores con sus juegos y parcelas asociadas
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

// Función para crear un jugador
export const postJugadores = async (req, res) => {
    const { nombre, apellido, fechaNacimiento, genero, estado, email } = req.body;

    if (!nombre || !email) {
        return res.status(400).json({ msg: "Bad Request. Please provide name and email." });
    }

    try {
        // Inserta un nuevo jugador en la base de datos
        const [result] = await pool.query(`
            INSERT INTO Jugadores (nombre, apellido, fechaNacimiento, genero, estado, email)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [nombre, apellido, fechaNacimiento, genero, estado, email]);

        // Consulta el jugador recién insertado
        const [rows] = await pool.query('SELECT * FROM Jugadores WHERE id = ?', [result.insertId]);

        // Envía el jugador recién insertado en formato JSON
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing your request.', details: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
    }
};

// Función para obtener un jugador por su ID
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

// Función para eliminar un jugador por su ID
export const deleteJugador = async (req, res) => {
    try {
        // Obtener todos los juegos asociados al jugador
        const [juegos] = await pool.execute("SELECT id FROM Juegos WHERE jugador_id = ?", [req.params.id]);

        // Eliminar los registros asociados en la tabla Parcelas para cada juego
        for (let juego of juegos) {
            await pool.execute("DELETE FROM Parcelas WHERE juego_id = ?", [juego.id]);
        }

        // Eliminar los registros asociados en la tabla Juegos para el jugador
        await pool.execute("DELETE FROM Juegos WHERE jugador_id = ?", [req.params.id]);

        // Eliminar el registro del jugador en la tabla Jugadores
        const [result] = await pool.execute("DELETE FROM Jugadores WHERE id = ?", [req.params.id]);

        // Verificar si se eliminó algún registro y responder con el código de estado correspondiente
        if (result.affectedRows === 0) return res.sendStatus(404);
        return res.sendStatus(204);
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

// Función para actualizar un jugador por su ID
export const putJugador = async (req, res) => {
    const { nombre, apellido, fechaNacimiento, genero, estado, email, Juego } = req.body;
    const jugadorId = req.params.id;

    if (!nombre || !apellido || !fechaNacimiento || !genero || !estado || !email || !Juego) {
        return res.status(400).json({ msg: "Bad Request. Please provide all player fields." });
    }

    try {
        // Establecer conexión a la base de datos
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

// Función para crear un juego asociado a un jugador
export const crearJuego = async (req, res) => {
    try {
        // Obtener datos del juego del cuerpo de la solicitud
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

        // Verificar si el jugador existe
        const [jugadorExistente] = await pool.query("SELECT * FROM Jugadores WHERE id = ?", [req.params.id]);
        if (jugadorExistente.length === 0) {
            return res.status(404).json({ message: "El jugador especificado no existe." });
        }
        
        // Insertar un nuevo juego en la base de datos
        const [juegoResult] = await pool.query(`
            INSERT INTO Juegos (jugador_id, fechaHoraInicio, fechaHoraFin, tipoFinanciamiento, noEstaciones, noContratos, balance, qytTrabajador, qytHerramienta, qytSemilla, qytAgua, qytFertilizante)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [req.params.id, fechaHoraInicio, fechaHoraFin, tipoFinanciamiento, noEstaciones, noContratos, balance, qytTrabajador, qytHerramienta, qytSemilla, qytAgua, qytFertilizante]);
        
        const juegoId = juegoResult.insertId;

        // Insertar cuatro tablas de parcelas asociadas al juego
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

// Función para obtener un juego por su ID
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

// Función para crear un resultado
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

// Función para obtener todos los resultados
export const getResult = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Resultados");
        res.json(rows);
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

// Función para actualizar el último juego y parcelas asociadas
export const putUltimoJuegoYParcelas = async (req, res) => {
    const { fechaHoraInicio, fechaHoraFin, tipoFinanciamiento, noEstaciones, noContratos, balance, qytTrabajador, qytHerramienta, qytSemilla, qytAgua, qytFertilizante } = req.body;
    
    try {
        // Iniciar una transacción
        const transaction = pool.transaction();
        await transaction.begin();
        const juegoId = req.params.id; 

        // Actualizar los datos del juego
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

        // Actualizar las parcelas asociadas al juego
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
                .input("desbloqueada", sql.Bit, parcela.desbloqueada)
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
        }

        // Commit de la transacción
        await transaction.commit();

        // Respuesta exitosa
        res.status(200).json({ message: "Juego y parcelas actualizados exitosamente." });
    } catch (error) {
        // Rollback en caso de error
        await transaction.rollback();
        res.status(500).json({ message: error.message });
    }
};
