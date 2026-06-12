\# Queries de Demostración — MongoDB



\## Colección: `hardware`

Base de datos: `inventario\_itu`



\---



\## 1. find — Buscar equipos por fabricante

db.hardware.find({ "fabricante": "Dell" })

Retorna todos los equipos cuyo fabricante es Dell.



\---



\## 2. find — Buscar por campo anidado

db.hardware.find({ "cpu.marca": "AMD" })

Retorna los equipos con procesador AMD.



\---



\## 3. find — Filtro múltiple

db.hardware.find({ "tipo": "desktop", "ram\_gb": { "$gte": 16 } })

Retorna los desktops con 16 GB de RAM o más.



\---



\## 4. updateOne — Actualizar RAM de un equipo

db.hardware.updateOne(

&#x20; { "numero\_serie": "SN-LAB3-001" },

&#x20; { "$set": { "ram\_gb": 8 } }

)

Simula una ampliación de RAM en el equipo del Lab. de Hardware.



\---



\## 5. aggregate — Contar equipos por fabricante

db.hardware.aggregate(\[

&#x20; { "$group": { "\_id": "$fabricante", "total": { "$sum": 1 } } },

&#x20; { "$sort": { "total": -1 } }

])

Agrupa y cuenta los equipos por fabricante, ordenado de mayor a menor.



\---



\## 6. deleteOne — Eliminar un equipo ⚠️ Ejecutar al final de la demo

db.hardware.deleteOne(

&#x20; { "numero\_serie": "SN-LAB4-002" }

)

Elimina el registro del equipo dado de baja. Ejecutar al final para que el documento siga disponible durante toda la demo de la app web.

