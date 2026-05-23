const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const resultados = [];

console.log("Leyendo el archivo CSV...");

// Leer el archivo CSV
fs.createReadStream('restaurante_master_data.csv')
  .pipe(csv())
  .on('data', (data) => resultados.push(data))
  .on('end', async () => {
    console.log(`¡Archivo leído! Se encontraron ${resultados.length} filas de ventas. Comenzando subida a Firebase...`);

    let contador = 0;
    
    // Recorrer cada fila del CSV y subirla a Firestore
    for (const fila of resultados) {
      await db.collection('ventas_historicas').add({
        id_pedido: Number(fila.id_pedido),
        fecha_hora: fila.fecha_hora,
        dia_semana: fila.dia_semana,
        hora: Number(fila.hora),
        metodo_pago: fila.metodo_pago,
        nombre_platillo: fila.nombre_platillo,
        categoria: fila.categoria,
        cantidad_vendida: Number(fila.cantidad_vendida),
        precio_venta_unitario: Number(fila.precio_venta_unitario),
        subtotal_venta: Number(fila.subtotal_venta),
        subtotal_margen_ganancia: Number(fila.subtotal_margen_ganancia)
      });
      
      contador++;
      // Imprimir progreso cada 50 filas
      if (contador % 50 === 0) {
        console.log(`Se han subido ${contador} registros...`);
      }
    }

    console.log("🚀 ¡Carga masiva completada con éxito! Revisa tu consola de Firebase.");
  });