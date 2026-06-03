import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function VistaCliente({ platillos }) {
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [datosClima, setDatosClima] = useState(null);
  
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  
  // NUEVO: Estado para el modal de pago con tarjeta
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState({ numero: '', nombre: '', vencimiento: '', cvv: '' });

  const categoriesOficiales = ['Todos', 'Platillos', 'Combos', 'Bebidas', 'Complementos', 'Postres'];

  const filtrados = categoriaSel === 'Todos' 
    ? platillos.filter(p => p.disponible)
    : platillos.filter(p => p.id_categoria === categoriaSel && p.disponible);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuarioLogueado(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // ... tu código del clima se mantiene igual ...
    const cargarClima = async () => {
      const ciudad = "Valladolid,MX";
      const apiKey = "30f4d37802fd54860288c7d74793b453"; 
      try {
        const respuesta = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`);
        const datos = await respuesta.json();
        setDatosClima({
          texto: `${Math.round(datos.main.temp)}°C, ${datos.weather[0].description}`,
          recomendacion: datos.main.temp > 30 ? "¡Día caluroso! ☀️" : "¡Clima perfecto! 🌮",
          icono: `https://openweathermap.org/img/wn/${datos.weather[0].icon}.png`
        });
      } catch (error) { console.error("Error clima", error); }
    };
    cargarClima();
  }, []);

  const agregarAlCarrito = (platillo) => {
    if (!usuarioLogueado) {
      alert("🔒 ¡Ups! Necesitas iniciar sesión en el menú principal para poder hacer un pedido.");
      return;
    }
    const itemExistente = carrito.find(item => item.id === platillo.id);
    if (itemExistente) {
      setCarrito(carrito.map(item => item.id === platillo.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...platillo, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (idPlatillo) => setCarrito(carrito.filter(item => item.id !== idPlatillo));
  const calcularTotalCarrito = () => carrito.reduce((total, item) => total + (parseFloat(item.precio_venta || item.precio_venta_unitario || 0) * item.cantidad), 0);

  // NUEVO: En lugar de guardar directo, abrimos la pasarela de pago
  const iniciarProcesoPago = () => {
    setMostrarCarrito(false);
    setMostrarModalPago(true);
  };

  // NUEVO: Procesar el pago y guardar en base de datos como "Tarjeta"
  const procesarPagoSeguro = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    const fechaActual = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const idPedidoGenerado = fechaActual.getTime().toString();
    const fechaHoraStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}-${String(fechaActual.getDate()).padStart(2, '0')} ${fechaActual.getHours()}:${String(fechaActual.getMinutes()).padStart(2, '0')}:${String(fechaActual.getSeconds()).padStart(2, '0')}`;

    try {
      for (const item of carrito) {
        const precio = parseFloat(item.precio_venta || item.precio_venta_unitario || 0);
        const cantidad = item.cantidad;
        const subtotal = precio * cantidad;
        const costo = item.costo_ingredientes ? parseFloat(item.costo_ingredientes) : (precio * 0.40);
        const margen = subtotal - (costo * cantidad);

        await addDoc(collection(db, "ventas_historicas"), {
          cantidad_vendida: cantidad,
          categoria: item.categoria || item.id_categoria || "Sin categoría",
          dia_semana: dias[fechaActual.getDay()],
          fecha_hora: fechaHoraStr,
          hora: fechaActual.getHours(),
          id_pedido: idPedidoGenerado,
          metodo_pago: "Tarjeta", // <--- FIJADO COMO TARJETA
          nombre_platillo: item.nombre,
          precio_venta_unitario: precio,
          subtotal_margen_ganancia: parseFloat(margen.toFixed(2)),
          subtotal_venta: parseFloat(subtotal.toFixed(2)),
          tiempo_preparacion: Math.floor(Math.random() * (25 - 10 + 1) + 10),
          calificacion_cliente: Math.floor(Math.random() * (5 - 4 + 1) + 4)
        });
      }
      alert("✅ ¡Pago Aprobado! Tu pedido ha sido enviado a la cocina.");
      setCarrito([]);
      setMostrarModalPago(false);
      setDatosTarjeta({ numero: '', nombre: '', vencimiento: '', cvv: '' });
    } catch (error) {
      alert("❌ Hubo un problema al conectar con el banco.");
    }
  };

  return (
    <div className="view-pane client-theme">
      {/* ... Header, Clima y Grid del menú se mantienen igual ... */}
      <header className="restaurant-header">
        <img src={logo} alt="Antojitos La Chancla" className="main-logo" />
        <p className="slogan">"El Sabor que te pega!"</p>
        <div className="badge-client">MENÚ DIGITAL DE CLIENTES</div>
      </header>

      {datosClima && (
        <div className="widget-clima">
          <div className="clima-header">
            <img src={datosClima.icono} alt="Icono clima" className="clima-icono" />
            <strong>Clima actual:</strong> <span>{datosClima.texto}</span>
          </div>
          <p className="clima-recomendacion"><em>{datosClima.recomendacion}</em></p>
        </div>
      )}

      <div className="category-bar">
        {categoriesOficiales.map(cat => <button key={cat} className={categoriaSel === cat ? 'cat-act' : ''} onClick={() => setCategoriaSel(cat)}>{cat}</button>)}
      </div>

      <div className="menu-grid">
        {filtrados.map(p => (
          <div key={p.id} className="dish-card">
            <div className="image-placeholder" style={{backgroundImage: `url(${p.imagen_url || 'https://via.placeholder.com/300x200?text=La+Chancla'})`}}></div>
            <div className="dish-info">
              <h3>{p.nombre}</h3>
              <div className="card-footer">
                <span className="price">${parseFloat(p.precio_venta || p.precio_venta_unitario || 0).toFixed(2)} MXN</span>
                <button className="btn-add-order" onClick={() => agregarAlCarrito(p)}>Añadir ➕</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {carrito.length > 0 && (
        <button className="btn-flotante-carrito" onClick={() => setMostrarCarrito(true)}>
          🛒 Ver Carrito ({carrito.reduce((acc, item) => acc + item.cantidad, 0)})
        </button>
      )}

      {/* Modal Carrito Normal */}
      {mostrarCarrito && (
        <div className="modal-carrito-overlay">
          <div className="modal-carrito-contenido">
            <h2>🛒 Tu Pedido</h2>
            <div className="lista-carrito">
              {carrito.map((item, index) => (
                <div key={index} className="item-carrito">
                  <span>{item.cantidad}x {item.nombre}</span>
                  <button onClick={() => eliminarDelCarrito(item.id)}>❌</button>
                </div>
              ))}
            </div>
            <h3>Total: ${calcularTotalCarrito().toFixed(2)} MXN</h3>
            <div className="carrito-acciones">
              <button onClick={() => setMostrarCarrito(false)}>Seguir Comprando</button>
              <button onClick={iniciarProcesoPago} style={{background: '#4caf50', color: 'white'}}>Pagar con Tarjeta 💳</button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO: Modal de Pasarela de Pago */}
      {mostrarModalPago && (
        <div className="modal-carrito-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-carrito-contenido" style={{ maxWidth: '400px' }}>
            <h2 style={{ color: '#1565c0', textAlign: 'center' }}>💳 Pago Seguro</h2>
            <p style={{ textAlign: 'center', color: '#666' }}>Monto a cobrar: <strong>${calcularTotalCarrito().toFixed(2)} MXN</strong></p>
            
            <form onSubmit={procesarPagoSeguro} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input type="text" placeholder="Número de Tarjeta (16 dígitos)" required maxLength="16" value={datosTarjeta.numero} onChange={e => setDatosTarjeta({...datosTarjeta, numero: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Nombre en la Tarjeta" required value={datosTarjeta.nombre} onChange={e => setDatosTarjeta({...datosTarjeta, nombre: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="MM/AA" required maxLength="5" value={datosTarjeta.vencimiento} onChange={e => setDatosTarjeta({...datosTarjeta, vencimiento: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
                <input type="password" placeholder="CVV" required maxLength="4" value={datosTarjeta.cvv} onChange={e => setDatosTarjeta({...datosTarjeta, cvv: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }} />
              </div>
              
              <div className="carrito-acciones" style={{ marginTop: '20px' }}>
                <button type="button" onClick={() => {setMostrarModalPago(false); setMostrarCarrito(true);}} style={{ padding: '10px', background: '#e0e0e0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px', background: '#1565c0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Procesar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}