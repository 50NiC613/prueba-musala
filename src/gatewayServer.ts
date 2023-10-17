import express from "express";
import http from "http";
import * as mongoose from "mongoose";
import { config } from "./config/config";
const router = express();
import Logging from "./library/Logging";
// Ruta de prueba
router.get("/", (req, res) => {
  res.send("¡Hola, mundo!");
});
// Conexión a la base de datos
mongoose
  .connect(config.mongo.url + "gateway", { retryWrites: true, w: "majority" })
  .then(() => {
    Logging.info("Conexión a la base de datos gateway establecida");
    StartServer();
  })
  .catch((err) => Logging.error(err));

// Iniciar el servidor
const StartServer = () => {
  router.use((req, res, next) => {
    Logging.info(
      `Incoming - > Method: [${req.method}] - URL: [${req.url}] - IP [${req.socket.remoteAddress}]`,
    );
    res.on("finish", () => {
      Logging.info(
        `Incoming - > Method: [${req.method}] - URL: [${req.url}] - IP [${req.socket.remoteAddress}] - Status: [#{res.statusCode}]`,
      );
    });
    next();
  });
  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());
};
/** Rules */
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }

  next();
});

/** Routes */
//router.use('/authors', authorRoutes);
//router.use('/books', bookRoutes);

/** Healthcheck */
router.get("/ping", (req, res, next) =>
  res.status(200).json({ hello: "world" }),
);

/** Error handling */
router.use((req, res, next) => {
  const error = new Error("Not found");

  Logging.error(error);

  res.status(404).json({
    message: error.message,
  });
});

http
  .createServer(router)
  .listen(config.server.port, () =>
    Logging.info(`Server is running on port ${config.server.port}`),
  );
