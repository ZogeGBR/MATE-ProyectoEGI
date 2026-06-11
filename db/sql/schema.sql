-- ============================================
-- Proyecto Integrador EGI — Integrante 2
-- Base de datos: inventario_itu
-- Motor: MySQL 8.x
-- ============================================

CREATE DATABASE IF NOT EXISTS inventario_itu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventario_itu;

CREATE TABLE AULAS (
  id_aula      INT          NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(100) NOT NULL,
  edificio     VARCHAR(100) NOT NULL,
  capacidad    INT          NOT NULL,
  PRIMARY KEY (id_aula)
) ENGINE=InnoDB;

CREATE TABLE LABORATORIOS (
  id_laboratorio    INT          NOT NULL AUTO_INCREMENT,
  nombre            VARCHAR(100) NOT NULL,
  id_aula           INT          NOT NULL,
  responsable_area  VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_laboratorio),
  CONSTRAINT fk_lab_aula FOREIGN KEY (id_aula)
    REFERENCES AULAS(id_aula)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE RESPONSABLES (
  id_responsable  INT          NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(80)  NOT NULL,
  apellido        VARCHAR(80)  NOT NULL,
  tipo            ENUM('tecnico','docente','alumno') NOT NULL,
  legajo          VARCHAR(20)  NOT NULL UNIQUE,
  email           VARCHAR(120) NOT NULL,
  PRIMARY KEY (id_responsable)
) ENGINE=InnoDB;

CREATE TABLE EQUIPOS (
  id_equipo       INT         NOT NULL AUTO_INCREMENT,
  numero_serie    VARCHAR(60) NOT NULL UNIQUE,
  mongo_id        VARCHAR(24) NOT NULL UNIQUE,
  id_laboratorio  INT         NOT NULL,
  numero_banco    INT         NOT NULL,
  id_responsable  INT         NOT NULL,
  fecha_alta      DATE        NOT NULL,
  PRIMARY KEY (id_equipo),
  CONSTRAINT fk_eq_lab  FOREIGN KEY (id_laboratorio)
    REFERENCES LABORATORIOS(id_laboratorio)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_eq_resp FOREIGN KEY (id_responsable)
    REFERENCES RESPONSABLES(id_responsable)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE MANTENIMIENTOS (
  id_mantenimiento  INT          NOT NULL AUTO_INCREMENT,
  id_equipo         INT          NOT NULL,
  fecha             DATE         NOT NULL,
  tipo              ENUM('preventivo','correctivo','actualizacion') NOT NULL,
  descripcion       VARCHAR(255) NOT NULL,
  tecnico           VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_mantenimiento),
  CONSTRAINT fk_mant_eq FOREIGN KEY (id_equipo)
    REFERENCES EQUIPOS(id_equipo)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;