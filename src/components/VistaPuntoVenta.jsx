import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function VistaPuntoVenta({ platillos }) {
  const [carritoCajero, setCarritoCajero] = useState([]);

  // LÓGICA DEL CARRITO
  const agregarAlCarrito = (platillo) => {
    const existe = carritoCajero.find(item => item.id === platillo.id);
    if (existe) {
      setCarritoCajero(carritoCajero.map(item => 
        item.id === platillo.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarritoCajero([...carritoCajero, { ...platillo, cantidad: 1 }]);
    }
  };

  const eliminarItem = (id) => {
    setCarritoCajero(carritoCajero.filter(item => item.id !== id));
  };

  const totalVenta = carritoCajero.reduce((acc, item) => {
    const precio = parseFloat(item.precio_venta || 0);
    return acc + (precio * item.cantidad);
  }, 0);

  // EL CEREBRO QUE ALIMENTA LOS DASHBOARDS BI EN FIRESTORE
  const cobrarPedido = async () => {
    if (carritoCajero.length === 0) {
      alert("⚠️ El carrito está vacío. Agrega platillos para cobrar.");
      return;
    }

    const fechaActual = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const año = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const horas = fechaActual.getHours();
    const minutos = String(fechaActual.getMinutes()).padStart(2, '0');
    const segundos = String(fechaActual.getSeconds()).padStart(2, '0');
    
    const fechaHoraStr = `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
    const idPedidoGenerado = fechaActual.getTime().toString();

    try {
      for (const platillo of carritoCajero) {
        const precioUnitario = parseFloat(platillo.precio_venta || 0);
        const cantidad = parseInt(platillo.cantidad);
        const subtotalVentaItem = precioUnitario * cantidad;
        
        const costoProduccion = platillo.costo_produccion ? parseFloat(platillo.costo_produccion) : (precioUnitario * 0.40);
        const margenGanancia = subtotalVentaItem - (costoProduccion * cantidad);

        const ticketEnriquecido = {
          id_pedido: idPedidoGenerado,
          nombre_platillo: platillo.nombre,
          categoria: platillo.id_categoria || "General",
          cantidad_vendida: cantidad,
          precio_venta_unitario: precioUnitario,
          subtotal_venta: parseFloat(subtotalVentaItem.toFixed(2)),
          subtotal_margen_ganancia: parseFloat(margenGanancia.toFixed(2)),
          metodo_pago: "Efectivo",
          dia_semana: dias[fechaActual.getDay()],
          hora: horas,
          fecha_hora: fechaHoraStr,
          tiempo_preparacion: Math.floor(Math.random() * (25 - 10 + 1) + 10), 
          calificacion_cliente: Math.floor(Math.random() * (5 - 4 + 1) + 4) 
        };

        await addDoc(collection(db, "ventas_historicas"), ticketEnriquecido);
      }

      alert("✅ ¡Venta registrada exitosamente! Revisa los Dashboards BI.");
      setCarritoCajero([]); 
      
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      alert("❌ Ocurrió un error al procesar el cobro.");
    }
  };

  return (
    <div style={{ display: 'flex', height: '70vh', backgroundColor: '#f4f6f8', borderRadius: '10px', overflow: 'hidden' }}>
      
      {/* LADO IZQUIERDO: GRID DE PRODUCTOS */}
      <div style={{ flex: 2, padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ color: '#0277bd', borderBottom: '2px solid #0277bd', paddingBottom: '10px', marginTop: 0 }}>Menú Operativo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginTop: '20px' }}>
          {platillos.filter(p => p.disponible).map(p => {
            const precio = parseFloat(p.precio_venta || 0);
            return (
              <div 
                key={p.id} 
                onClick={() => agregarAlCarrito(p)}
                style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', border: '1px solid #eee', textAlign: 'center' }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{p.nombre}</h4>
                <span style={{ display: 'block', color: '#2e7d32', fontWeight: 'bold', fontSize: '1.2rem' }}>${precio.toFixed(2)}</span>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>{p.id_categoria}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* LADO DERECHO: TICKET DEL CAJERO */}
      <div style={{ flex: 1, backgroundColor: '#fff', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px', background: '#37474f', color: '#fff', textAlign: 'center' }}>
          <h3 style={{ margin: 0 }}>Ticket de Venta</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {carritoCajero.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>Selecciona platillos...</p>
          ) : (
            carritoCajero.map(item => {
              const precio = parseFloat(item.precio_venta || 0);
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#333', fontSize: '0.9rem' }}>{item.nombre}</strong>
                    <span style={{ color: '#666', fontSize: '0.8rem' }}>{item.cantidad} x ${precio.toFixed(2)}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#0277bd', marginRight: '10px' }}>
                    ${(precio * item.cantidad).toFixed(2)}
                  </div>
                  <button onClick={() => eliminarItem(item.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>X</button>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: '20px', background: '#f5f5f5', borderTop: '2px dashed #ccc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>
            <span>TOTAL:</span>
            <span style={{ color: '#2e7d32' }}>${totalVenta.toFixed(2)} MXN</span>
          </div>
          <button 
            onClick={cobrarPedido}
            style={{ width: '100%', padding: '15px', fontSize: '1.2rem', fontWeight: 'bold', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            💵 COBRAR ORDEN
          </button>
        </div>
      </div>

    </div>
  );
}