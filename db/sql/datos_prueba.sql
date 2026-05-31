USE inventario_itu;

INSERT INTO AULAS (nombre, edificio, capacidad) VALUES
  ('Aula 101',           'Edificio A', 30),
  ('Aula 203',           'Edificio A', 25),
  ('Aula 305',           'Edificio B', 40),
  ('Sala de Servidores', 'Edificio B', 10);

INSERT INTO LABORATORIOS (nombre, id_aula, responsable_area) VALUES
  ('Lab. de Redes',         1, 'Depto. Informática'),
  ('Lab. de Programación',  2, 'Depto. Sistemas'),
  ('Lab. de Hardware',      3, 'Depto. Electrónica'),
  ('Lab. de Base de Datos', 3, 'Depto. Informática');

INSERT INTO RESPONSABLES (nombre, apellido, tipo, legajo, email) VALUES
  ('Carlos',   'Méndez',   'tecnico', 'TEC-001', 'cmendez@itu.edu.ar'),
  ('Laura',    'Gómez',    'docente', 'DOC-042', 'lgomez@itu.edu.ar'),
  ('Martín',   'Ríos',     'alumno',  'ALU-318', 'mrios@alumnos.itu.edu.ar'),
  ('Valeria',  'Torres',   'docente', 'DOC-075', 'vtorres@itu.edu.ar'),
  ('Federico', 'Castillo', 'alumno',  'ALU-521', 'fcastillo@alumnos.itu.edu.ar');

INSERT INTO EQUIPOS (numero_serie, mongo_id, id_laboratorio, numero_banco, id_responsable, fecha_alta) VALUES
  ('SN-LAB1-001', '64a1f3c2e4b0d5f8a9c2e101', 1, 1, 1, '2023-03-10'),
  ('SN-LAB1-002', '64a1f3c2e4b0d5f8a9c2e102', 1, 2, 1, '2023-03-10'),
  ('SN-LAB1-003', '64a1f3c2e4b0d5f8a9c2e103', 1, 3, 2, '2023-05-15'),
  ('SN-LAB2-001', '64a1f3c2e4b0d5f8a9c2e104', 2, 1, 2, '2022-08-01'),
  ('SN-LAB2-002', '64a1f3c2e4b0d5f8a9c2e105', 2, 2, 3, '2022-08-01'),
  ('SN-LAB2-003', '64a1f3c2e4b0d5f8a9c2e106', 2, 3, 4, '2024-01-20'),
  ('SN-LAB3-001', '64a1f3c2e4b0d5f8a9c2e107', 3, 1, 1, '2021-11-05'),
  ('SN-LAB3-002', '64a1f3c2e4b0d5f8a9c2e108', 3, 2, 5, '2021-11-05'),
  ('SN-LAB4-001', '64a1f3c2e4b0d5f8a9c2e109', 4, 1, 4, '2024-03-01'),
  ('SN-LAB4-002', '64a1f3c2e4b0d5f8a9c2e110', 4, 2, 1, '2024-03-01'),
  ('SN-LAB1-004', '64a1f3c2e4b0d5f8a9c2e111', 1, 4, 1, '2023-06-01'),
  ('SN-LAB1-005', '64a1f3c2e4b0d5f8a9c2e112', 1, 5, 2, '2023-06-01'),
  ('SN-LAB2-004', '64a1f3c2e4b0d5f8a9c2e113', 2, 4, 3, '2022-09-15'),
  ('SN-LAB2-005', '64a1f3c2e4b0d5f8a9c2e114', 2, 5, 4, '2022-09-15'),
  ('SN-LAB3-003', '64a1f3c2e4b0d5f8a9c2e115', 3, 3, 5, '2021-12-10'),
  ('SN-LAB3-004', '64a1f3c2e4b0d5f8a9c2e116', 3, 4, 1, '2021-12-10'),
  ('SN-LAB3-005', '64a1f3c2e4b0d5f8a9c2e117', 3, 5, 2, '2024-02-20'),
  ('SN-LAB4-003', '64a1f3c2e4b0d5f8a9c2e118', 4, 3, 3, '2024-04-01'),
  ('SN-LAB4-004', '64a1f3c2e4b0d5f8a9c2e119', 4, 4, 4, '2024-04-01'),
  ('SN-LAB4-005', '64a1f3c2e4b0d5f8a9c2e120', 4, 5, 5, '2024-04-01');

INSERT INTO MANTENIMIENTOS (id_equipo, fecha, tipo, descripcion, tecnico) VALUES
  (1,  '2023-06-15', 'preventivo',    'Limpieza de componentes y actualización de drivers',  'Carlos Méndez'),
  (1,  '2024-01-10', 'correctivo',    'Reemplazo de fuente de alimentación defectuosa',       'Carlos Méndez'),
  (2,  '2023-09-20', 'preventivo',    'Revisión general y limpieza de ventiladores',          'Carlos Méndez'),
  (4,  '2023-04-05', 'actualizacion', 'Ampliación de RAM de 8 GB a 16 GB',                    'Carlos Méndez'),
  (5,  '2023-07-18', 'correctivo',    'Formateo y reinstalación de sistema operativo',        'Laura Gómez'),
  (7,  '2022-02-28', 'preventivo',    'Revisión de conexiones internas y limpieza general',   'Carlos Méndez'),
  (9,  '2024-04-12', 'actualizacion', 'Instalación de SSD 480 GB en reemplazo de HDD',        'Carlos Méndez'),
  (10, '2024-05-03', 'correctivo',    'Reparación de puerto USB y reemplazo de teclado',      'Laura Gómez');