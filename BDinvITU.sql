CREATE DATABASE  IF NOT EXISTS `inventario_itu` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `inventario_itu`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: inventario_itu
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `aulas`
--

DROP TABLE IF EXISTS `aulas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aulas` (
  `id_aula` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `edificio` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacidad` int NOT NULL,
  PRIMARY KEY (`id_aula`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aulas`
--

LOCK TABLES `aulas` WRITE;
/*!40000 ALTER TABLE `aulas` DISABLE KEYS */;
INSERT INTO `aulas` VALUES (1,'Aula 101','Edificio A',30),(2,'Aula 203','Edificio A',25),(3,'Aula 305','Edificio B',40),(4,'Sala de Servidores','Edificio B',10);
/*!40000 ALTER TABLE `aulas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipos`
--

DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipos` (
  `id_equipo` int NOT NULL AUTO_INCREMENT,
  `numero_serie` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mongo_id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_laboratorio` int NOT NULL,
  `numero_banco` int NOT NULL,
  `id_responsable` int NOT NULL,
  `fecha_alta` date NOT NULL,
  PRIMARY KEY (`id_equipo`),
  UNIQUE KEY `numero_serie` (`numero_serie`),
  UNIQUE KEY `mongo_id` (`mongo_id`),
  KEY `fk_eq_lab` (`id_laboratorio`),
  KEY `fk_eq_resp` (`id_responsable`),
  CONSTRAINT `fk_eq_lab` FOREIGN KEY (`id_laboratorio`) REFERENCES `laboratorios` (`id_laboratorio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_eq_resp` FOREIGN KEY (`id_responsable`) REFERENCES `responsables` (`id_responsable`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipos`
--

LOCK TABLES `equipos` WRITE;
/*!40000 ALTER TABLE `equipos` DISABLE KEYS */;
INSERT INTO `equipos` VALUES (1,'SN-LAB1-001','64a1f3c2e4b0d5f8a9c2e101',1,1,1,'2023-03-10'),(2,'SN-LAB1-002','64a1f3c2e4b0d5f8a9c2e102',1,2,1,'2023-03-10'),(3,'SN-LAB1-003','64a1f3c2e4b0d5f8a9c2e103',1,3,2,'2023-05-15'),(4,'SN-LAB2-001','64a1f3c2e4b0d5f8a9c2e104',2,1,2,'2022-08-01'),(5,'SN-LAB2-002','64a1f3c2e4b0d5f8a9c2e105',2,2,3,'2022-08-01'),(6,'SN-LAB2-003','64a1f3c2e4b0d5f8a9c2e106',2,3,4,'2024-01-20'),(7,'SN-LAB3-001','64a1f3c2e4b0d5f8a9c2e107',3,1,1,'2021-11-05'),(8,'SN-LAB3-002','64a1f3c2e4b0d5f8a9c2e108',3,2,5,'2021-11-05'),(9,'SN-LAB4-001','64a1f3c2e4b0d5f8a9c2e109',4,1,4,'2024-03-01'),(10,'SN-LAB4-002','64a1f3c2e4b0d5f8a9c2e110',4,2,1,'2024-03-01'),(11,'SN-LAB1-004','64a1f3c2e4b0d5f8a9c2e111',1,4,1,'2023-06-01'),(12,'SN-LAB1-005','64a1f3c2e4b0d5f8a9c2e112',1,5,2,'2023-06-01'),(13,'SN-LAB2-004','64a1f3c2e4b0d5f8a9c2e113',2,4,3,'2022-09-15'),(14,'SN-LAB2-005','64a1f3c2e4b0d5f8a9c2e114',2,5,4,'2022-09-15'),(15,'SN-LAB3-003','64a1f3c2e4b0d5f8a9c2e115',3,3,5,'2021-12-10'),(16,'SN-LAB3-004','64a1f3c2e4b0d5f8a9c2e116',3,4,1,'2021-12-10'),(17,'SN-LAB3-005','64a1f3c2e4b0d5f8a9c2e117',3,5,2,'2024-02-20'),(18,'SN-LAB4-003','64a1f3c2e4b0d5f8a9c2e118',4,3,3,'2024-04-01'),(19,'SN-LAB4-004','64a1f3c2e4b0d5f8a9c2e119',4,4,4,'2024-04-01'),(20,'SN-LAB4-005','64a1f3c2e4b0d5f8a9c2e120',4,5,5,'2024-04-01');
/*!40000 ALTER TABLE `equipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laboratorios`
--

DROP TABLE IF EXISTS `laboratorios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laboratorios` (
  `id_laboratorio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_aula` int NOT NULL,
  `responsable_area` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_laboratorio`),
  KEY `fk_lab_aula` (`id_aula`),
  CONSTRAINT `fk_lab_aula` FOREIGN KEY (`id_aula`) REFERENCES `aulas` (`id_aula`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laboratorios`
--

LOCK TABLES `laboratorios` WRITE;
/*!40000 ALTER TABLE `laboratorios` DISABLE KEYS */;
INSERT INTO `laboratorios` VALUES (1,'Lab. de Redes',1,'Depto. Informática'),(2,'Lab. de Programación',2,'Depto. Sistemas'),(3,'Lab. de Hardware',3,'Depto. Electrónica'),(4,'Lab. de Base de Datos',3,'Depto. Informática');
/*!40000 ALTER TABLE `laboratorios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mantenimientos`
--

DROP TABLE IF EXISTS `mantenimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mantenimientos` (
  `id_mantenimiento` int NOT NULL AUTO_INCREMENT,
  `id_equipo` int NOT NULL,
  `fecha` date NOT NULL,
  `tipo` enum('preventivo','correctivo','actualizacion') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tecnico` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_mantenimiento`),
  KEY `fk_mant_eq` (`id_equipo`),
  CONSTRAINT `fk_mant_eq` FOREIGN KEY (`id_equipo`) REFERENCES `equipos` (`id_equipo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mantenimientos`
--

LOCK TABLES `mantenimientos` WRITE;
/*!40000 ALTER TABLE `mantenimientos` DISABLE KEYS */;
INSERT INTO `mantenimientos` VALUES (1,1,'2023-06-15','preventivo','Limpieza de componentes y actualización de drivers','Carlos Méndez'),(2,1,'2024-01-10','correctivo','Reemplazo de fuente de alimentación defectuosa','Carlos Méndez'),(3,2,'2023-09-20','preventivo','Revisión general y limpieza de ventiladores','Carlos Méndez'),(4,4,'2023-04-05','actualizacion','Ampliación de RAM de 8 GB a 16 GB','Carlos Méndez'),(5,5,'2023-07-18','correctivo','Formateo y reinstalación de sistema operativo','Laura Gómez'),(6,7,'2022-02-28','preventivo','Revisión de conexiones internas y limpieza general','Carlos Méndez'),(7,9,'2024-04-12','actualizacion','Instalación de SSD 480 GB en reemplazo de HDD','Carlos Méndez'),(8,10,'2024-05-03','correctivo','Reparación de puerto USB y reemplazo de teclado','Laura Gómez');
/*!40000 ALTER TABLE `mantenimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `responsables`
--

DROP TABLE IF EXISTS `responsables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsables` (
  `id_responsable` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('tecnico','docente','alumno') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `legajo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_responsable`),
  UNIQUE KEY `legajo` (`legajo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `responsables`
--

LOCK TABLES `responsables` WRITE;
/*!40000 ALTER TABLE `responsables` DISABLE KEYS */;
INSERT INTO `responsables` VALUES (1,'Carlos','Méndez','tecnico','TEC-001','cmendez@itu.edu.ar'),(2,'Laura','Gómez','docente','DOC-042','lgomez@itu.edu.ar'),(3,'Martín','Ríos','alumno','ALU-318','mrios@alumnos.itu.edu.ar'),(4,'Valeria','Torres','docente','DOC-075','vtorres@itu.edu.ar'),(5,'Federico','Castillo','alumno','ALU-521','fcastillo@alumnos.itu.edu.ar');
/*!40000 ALTER TABLE `responsables` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 19:00:56
