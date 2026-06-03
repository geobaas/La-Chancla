import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function VistaPuntoVenta() {
  const [menu, setMenu] = useState([]);
  const [carritoCajero, setCarritoCajero] = useState([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [simulandoTerminal, setSimulandoTerminal] = useState(false);
  
  // NUEVO: Estado para agrupar por categorías
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menu_items"), (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setMenu(items);
    });
    return () => unsubscribe();
  }, []);

  // Filtrado automático de categorías basadas en la BD
  const categoriasUnicas = ['Todos', ...new Set(menu.map(item => item.categoria || 'Otros'))];
  const menuFiltrado = categoriaSeleccionada === 'Todos' 
    ? menu 
    : menu.filter(item => (item.categoria || 'Otros') === categoriaSeleccionada);

  const agregarAlCarrito = (platillo) => {
    const existe = carritoCajero.find(item => item.id === platillo.id);
    if (existe) setCarritoCajero(carritoCajero.map(item => item.id === platillo.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    else setCarritoCajero([...carritoCajero, { ...platillo, cantidad: 1 }]);
  };

  const eliminarItem = (id) => setCarritoCajero(carritoCajero.filter(item => item.id !== id));
  
  const totalVenta = carritoCajero.reduce((acc, item) => acc + (parseFloat(item.precio_venta || item.precio_venta_unitario || item.precio || 0) * item.cantidad), 0);

  const ejecutarGuardadoDB = async () => {
    const fechaActual = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const fechaHoraStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')} ${fechaActual.getHours()}:${String(fechaActual.getMinutes()).padStart(2, '0')}:${String(fechaActual.getSeconds()).padStart(2, '0')}`;
    const idPedidoGenerado = fechaActual.getTime().toString();

    try {
      for (const platillo of carritoCajero) {
        const precioUnitario = parseFloat(platillo.precio_venta || platillo.precio_venta_unitario || platillo.precio || 0);
        const cantidad = parseInt(platillo.cantidad);
        const subtotalVentaItem = precioUnitario * cantidad;
        const costoEstimado = platillo.costo_ingredientes ? parseFloat(platillo.costo_ingredientes) : (precioUnitario * 0.40);
        const margenGanancia = subtotalVentaItem - (costoEstimado * cantidad);

        await addDoc(collection(db, "ventas_historicas"), {
          id_pedido: idPedidoGenerado,
          nombre_platillo: platillo.nombre,
          categoria: platillo.categoria || "Comida",
          cantidad_vendida: cantidad,
          precio_venta_unitario: precioUnitario,
          subtotal_venta: parseFloat(subtotalVentaItem.toFixed(2)),
          subtotal_margen_ganancia: parseFloat(margenGanancia.toFixed(2)),
          metodo_pago: metodoPago, 
          dia_semana: dias[fechaActual.getDay()],
          hora: fechaActual.getHours(),
          fecha_hora: fechaHoraStr,
          tiempo_preparacion: Math.floor(Math.random() * (25 - 10 + 1) + 10),
          calificacion_cliente: Math.floor(Math.random() * (5 - 4 + 1) + 4)
        });
      }
      alert(`✅ ¡Venta registrada exitosamente con ${metodoPago}!`);
      setCarritoCajero([]);
      setMetodoPago('Efectivo');
    } catch (error) {
      alert("❌ Ocurrió un error al procesar el cobro.");
    }
  };

  const cobrarPedido = () => {
    if (carritoCajero.length === 0) return alert("⚠️ El carrito está vacío.");
    
    if (metodoPago === 'Tarjeta') {
      setSimulandoTerminal(true);
      setTimeout(() => {
        setSimulandoTerminal(false);
        ejecutarGuardadoDB();
      }, 3000);
    } else {
      ejecutarGuardadoDB();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f6f8', position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      
      {simulandoTerminal && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>💳</h1>
            <h2 style={{ color: '#1565c0', marginTop: '10px' }}>Conectando con la terminal...</h2>
            <p style={{ color: '#666', fontSize: '1.2rem' }}>Pida al cliente que inserte o acerque su tarjeta</p>
            <div style={{ marginTop: '20px', fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800', animation: 'blink 1s infinite' }}>Procesando el cobro de ${totalVenta.toFixed(2)} MXN</div>
          </div>
          <style>{`@keyframes blink { 50% { opacity: 0.5; } }`}</style>
        </div>
      )}

      {/* LADO IZQUIERDO: GRID Y GRUPOS (Optimizado para Tablet) */}
      <div style={{ flex: 1.8, display: 'flex', flexDirection: 'column', padding: '15px', overflow: 'hidden' }}>
        
        {/* Barra de Categorías / Grupos */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px', borderBottom: '2px solid #ddd' }}>
          {categoriasUnicas.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoriaSeleccionada(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: categoriaSeleccionada === cat ? '#0277bd' : '#e0e0e0',
                color: categoriaSeleccionada === cat ? '#fff' : '#333',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: '0.2s',
                fontSize: '0.9rem'
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Tarjetas más pequeñas (minmax 120px) */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
            {menuFiltrado.map(p => {
              const precio = parseFloat(p.precio_venta || p.precio_venta_unitario || p.precio || 0);
              return (
                <div 
                  key={p.id} 
                  onClick={() => agregarAlCarrito(p)} 
                  style={{ 
                    background: '#fff', 
                    padding: '12px 8px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    border: '1px solid #e0e0e0', 
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '0.85rem', lineHeight: '1.2' }}>{p.nombre}</h4>
                  <span style={{ display: 'block', color: '#2e7d32', fontWeight: 'bold', fontSize: '1rem' }}>${precio.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LADO DERECHO: TICKET Y COBRO (Optimizado para Tablet) */}
      <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#fff', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', boxShadow: '-2px 0 10px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '15px', background: '#37474f', color: '#fff', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Ticket Actual</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {carritoCajero.map(item => {
            const precio = parseFloat(item.precio_venta || item.precio_venta_unitario || item.precio || 0);
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                <div style={{ flex: 1, paddingRight: '10px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#333' }}>{item.nombre}</strong><br/>
                  <small style={{ color: '#666' }}>{item.cantidad} x ${precio.toFixed(2)}</small>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0277bd' }}>${(precio * item.cantidad).toFixed(2)}</div>
                <button onClick={() => eliminarItem(item.id)} style={{ color: '#c62828', background: '#ffebee', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}>X</button>
              </div>
            );
          })}
        </div>

        {/* SECCIÓN DE COBRO COMPACTA */}
        <div style={{ padding: '15px', background: '#fafafa', borderTop: '2px dashed #ccc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '15px', alignItems: 'center' }}>
            <span style={{ color: '#555' }}>TOTAL:</span>
            <span style={{ color: '#2e7d32' }}>${totalVenta.toFixed(2)} MXN</span>
          </div>
          
          <select 
            value={metodoPago} 
            onChange={(e) => setMetodoPago(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', color: '#333' }}>
            <option value="Efectivo">💵 Efectivo</option>
            <option value="Tarjeta">💳 Tarjeta (Terminal)</option>
            <option value="Transferencia">📱 Transferencia</option>
          </select>

          <button 
            onClick={cobrarPedido}
            style={{ width: '100%', padding: '15px', fontSize: '1.2rem', fontWeight: 'bold', background: metodoPago === 'Tarjeta' ? '#1565c0' : '#4caf50', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {metodoPago === 'Tarjeta' ? 'ENVIAR A TERMINAL' : 'COBRAR ORDEN'}
          </button>
        </div>
      </div>

    </div>
  );
}