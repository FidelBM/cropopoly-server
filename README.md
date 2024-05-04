¡Por supuesto! Aquí tienes un README.md que se centra específicamente en las instrucciones para configurar y ejecutar el servidor:

---

# Cropopoly Server

Cropopoly Server es el servidor backend para la aplicación Cropopoly, un juego de simulación agrícola en línea. Este servidor proporciona una API RESTful para gestionar usuarios, juegos, parcelas y más.

## Instalación

Para ejecutar el servidor Cropopoly en tu máquina local, sigue estos pasos:

### Requisitos previos

Asegúrate de tener instalado [Node.js](https://nodejs.org/) en tu sistema. Puedes descargarlo desde el [sitio oficial de Node.js](https://nodejs.org/en/download/current).

Además, necesitarás una base de datos MySQL en funcionamiento.

### Pasos de instalación

1. Clona este repositorio en tu máquina local o descárgalo como archivo ZIP.
2. Abre una terminal y navega hasta la ubicación del repositorio clonado.
3. Ejecuta el siguiente comando para instalar las dependencias del proyecto:

    ```bash
    npm install
    ```

## Configuración

Antes de ejecutar el servidor, asegúrate de configurar correctamente las variables de entorno en el archivo `.env`. Puedes encontrar un ejemplo en el archivo `.env.example`. Asegúrate de tener configuradas las siguientes variables:

- `PORT`: Puerto en el que se ejecutará el servidor.
- `DB_HOST`: Host de la base de datos MySQL.
- `DB_USER`: Usuario de la base de datos MySQL.
- `DB_PASSWORD`: Contraseña de la base de datos MySQL.
- `DB_NAME`: Nombre de la base de datos MySQL.
- `DB_PORT`: Puerto de la base de datos MySQL.

## Uso

Una vez que hayas completado la instalación y configuración, puedes ejecutar el servidor Cropopoly utilizando el siguiente comando:

```bash
npm run dev
```

El servidor estará disponible en el puerto especificado en la variable de entorno `PORT`.
