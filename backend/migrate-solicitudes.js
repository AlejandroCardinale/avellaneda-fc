const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'avellaneda_fc',
    multipleStatements: true
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS catalogo_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      categoria ENUM('indumentaria','equipamiento','transporte') NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      descripcion VARCHAR(255),
      icono VARCHAR(60) NOT NULL DEFAULT 'fa-box',
      requiere_talle BOOLEAN NOT NULL DEFAULT FALSE,
      requiere_numero BOOLEAN NOT NULL DEFAULT FALSE,
      activo BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);
  console.log('✅ catalogo_items creada');

  const items = [
    [1,'indumentaria','Camiseta de juego','Camiseta oficial del club con dorsal','fa-shirt',1,1],
    [2,'indumentaria','Short de juego','Short oficial del club','fa-person-running',1,0],
    [3,'indumentaria','Medias','Medias de juego','fa-socks',1,0],
    [4,'indumentaria','Buzo','Buzo de entrenamiento','fa-shirt',1,0],
    [5,'indumentaria','Campera','Campera impermeable del club','fa-shirt',1,0],
    [6,'indumentaria','Conjunto de arquero','Camiseta + Short arquero','fa-hand',1,1],
    [7,'equipamiento','Pelota de futbol N5','Pelota reglamentaria','fa-futbol',0,0],
    [8,'equipamiento','Pelota de futbol N4','Pelota categorias juveniles','fa-futbol',0,0],
    [9,'equipamiento','Pelota de basquet','Pelota oficial basquet','fa-basketball',0,0],
    [10,'equipamiento','Arco de futbol','Arco reglamentario portatil','fa-square',0,0],
    [11,'equipamiento','Vallas de atletismo','Vallas de 0.91 m','fa-minus',0,0],
    [12,'equipamiento','Colchoneta','Colchoneta de gimnasia','fa-bed',0,0],
    [13,'equipamiento','Conos','Conos de entrenamiento','fa-traffic-cone',0,0],
    [14,'equipamiento','Pecheras','Pecheras de colores (x10)','fa-shirt',0,0],
    [15,'equipamiento','Escalera de agilidad','Escalera de coordinacion','fa-ruler-horizontal',0,0],
    [16,'equipamiento','Palos de salto','Para entrenamiento de salto','fa-arrows-up-down',0,0],
    [17,'transporte','Micro chico (20 pax)','Minibus para 20 pasajeros','fa-bus',0,0],
    [18,'transporte','Micro mediano (40 pax)','Micro para 40 pasajeros','fa-bus',0,0],
    [19,'transporte','Micro grande (60 pax)','Micro para 60 pasajeros','fa-bus-simple',0,0],
    [20,'transporte','Camioneta','Camioneta para traslado de equipamiento','fa-truck',0,0],
  ];

  for (const [id,cat,nombre,desc,icono,talle,num] of items) {
    await conn.execute(
      'INSERT IGNORE INTO catalogo_items (id,categoria,nombre,descripcion,icono,requiere_talle,requiere_numero) VALUES (?,?,?,?,?,?,?)',
      [id,cat,nombre,desc,icono,talle,num]
    );
  }
  console.log('✅ catalogo_items poblado con', items.length, 'items');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS solicitudes (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NOT NULL,
      tipo ENUM('indumentaria','equipamiento','transporte') NOT NULL,
      estado ENUM('pendiente','aprobada','rechazada','entregada') NOT NULL DEFAULT 'pendiente',
      fecha_necesidad DATE NOT NULL,
      destino VARCHAR(200),
      pasajeros TINYINT UNSIGNED,
      observaciones TEXT,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_sol_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);
  console.log('✅ solicitudes creada');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS solicitud_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      solicitud_id INT UNSIGNED NOT NULL,
      item_id INT UNSIGNED NOT NULL,
      cantidad TINYINT UNSIGNED NOT NULL DEFAULT 1,
      talle VARCHAR(10),
      numero_dorsal TINYINT UNSIGNED,
      observacion VARCHAR(255),
      CONSTRAINT fk_solitem_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
      CONSTRAINT fk_solitem_item FOREIGN KEY (item_id) REFERENCES catalogo_items(id)
    )
  `);
  console.log('✅ solicitud_items creada');

  await conn.end();
  console.log('\n🎉 Migración completada!');
}

migrate().catch(e => { console.error('❌ ERROR:', e.message); process.exit(1); });
