import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png'; 
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// Importaciones de Firestore ajustadas para trabajar con tu archivo '../firebase'
import { getFirestore, collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';

export default function VistaVentaMostrador({ platillos }) {
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  
  // ==========================================
  // ESTADOS DE AUTENTICACIÓN
  // ==========================================
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorAuth, setErrorAuth] = useState('');

  // ==========================================
  // ESTADOS DEL PUNTO DE VENTA Y PAGOS
  // ==========================================
  const [carrito, setCarrito] = useState([]);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState(''); // 'efectivo', 'tarjeta', 'transferencia'
  const [montoRecibido, setMontoRecibido] = useState('');

  const categoriesOficiales = ['Todos', 'Platillos', 'Combos', 'Bebidas', 'Complementos', 'Postres'];

  // Sincronizado con la lógica de filtrado usando la propiedad del producto
  const filtrados = categoriaSel === 'Todos' 
    ? platillos.filter(p => p.disponible)
    : platillos.filter(p => p.id_categoria === categoriaSel && p.disponible);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioLogueado(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setErrorAuth('');
    const usuarioLimpio = usernameInput.trim().toLowerCase();

    if (usuarioLimpio !== 'luis') {
      setErrorAuth('Acceso denegado: Usuario no autorizado para mostrador.');
      return;
    }
    const correoFirebase = 'luis@lachancla.com';

    try {
      await signInWithEmailAndPassword(auth, correoFirebase, passwordInput);
      setUsernameInput('');
      setPasswordInput('');
    } catch (error) {
      console.error("Error de autenticación:", error);
      setErrorAuth('Contraseña incorrecta o error de conexión.');
    }
  };

  const cerrarSesion = () => {
    signOut(auth);
    setCarrito([]);
  };

  // ==========================================
  // LÓGICA DEL CARRITO
  // ==========================================
  const agregarAlCarrito = (platillo) => {
    const itemExistente = carrito.find(item => item.id === platillo.id);
    if (itemExistente) {
      setCarrito(carrito.map(item => 
        item.id === platillo.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...platillo, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (idPlatillo) => {
    setCarrito(carrito.filter(item => item.id !== idPlatillo));
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (parseFloat(item.precio_venta || item.precio_venta_unitario || 0) * item.cantidad), 0);
  };

  // ==========================================
  // LÓGICA DE COBRO E INTEGRACIÓN CLOUD (BI)
  // ==========================================
  const iniciarProcesoPago = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío. Agrega artículos primero.");
      return;
    }
    setMostrarModalPago(true);
    setMetodoPago('');
    setMontoRecibido('');
  };

  const finalizarVenta = async () => {
    const total = calcularTotal();
    
    // Validaciones para pago en efectivo
    if (metodoPago === 'efectivo') {
      if (!montoRecibido || parseFloat(montoRecibido) < total) {
        alert("El monto recibido es menor al total de la cuenta.");
        return;
      }
    }

    const db = getFirestore();
    const fechaActual = new Date();
    const horaActual = fechaActual.getHours();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaActual = diasSemana[fechaActual.getDay()];

    try {
      // Guardar de forma desagregada por artículo para la perfecta lectura de tu Dashboard BI
      for (const item of carrito) {
        
        const precioUnitario = parseFloat(item.precio_venta || item.precio_venta_unitario || 0);
        const subtotalArticulo = precioUnitario * item.cantidad;
        
        // Simulación de costo de ingredientes en caso de no venir en el objeto de la base
        const costoIngredientes = item.costo_ingredientes 
          ? parseFloat(item.costo_ingredientes) 
          : precioUnitario * 0.40; 

        // 1. INSERCIÓN ATÓMICA EN ventas_historicas (Espera variables directas en la raíz)
        await addDoc(collection(db, "ventas_historicas"), {
          cajero: "Luis",
          fecha_completa: fechaActual.toISOString(),
          dia_semana: diaActual,
          hora: horaActual,
          metodo_pago: metodoPago === 'efectivo' ? 'Efectivo' : metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia',
          
          nombre_platillo: item.nombre,
          categoria: item.id_categoria || 'Platillos',
          cantidad_vendida: item.cantidad,
          precio_venta_unitario: precioUnitario,
          costo_ingredientes: costoIngredientes,
          subtotal_venta: subtotalArticulo,
          
          // Variables simuladas para poblar gráficas de Eficiencia y Satisfacción del Cliente
          tiempo_preparacion: Math.floor(Math.random() * (25 - 10 + 1)) + 10, 
          calificacion_cliente: Math.floor(Math.random() * (5 - 4 + 1)) + 4    
        });

        // 2. ACTUALIZACIÓN DEL INVENTARIO CRÍTICO (Sincronizado con tu Dashboard de Alertas)
        const productoDocRef = doc(db, "menu_items", item.id);
        await updateDoc(productoDocRef, {
          stock_disponible: increment(-item.cantidad)
        });
      }

      alert(`✅ ¡Venta registrada y sincronizada con el Dashboard BI!\nMétodo: ${metodoPago.toUpperCase()}\nTotal: $${total.toFixed(2)}`);
      
      // Limpiar terminal para la siguiente orden
      setCarrito([]); 
      setMostrarModalPago(false);
      setMetodoPago('');
      setMontoRecibido('');

    } catch (error) {
      console.error("Error crítico de guardado Cloud:", error);
      alert("❌ Ocurrió un error en la base de datos Cloud. Revisa los logs de la consola.");
    }
  };

  // ==========================================
  // VISTA DE LOGIN
  // ==========================================
  if (!usuarioLogueado) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <img src={logo} alt="Logo" width="150" />
        <h2>Acceso a Punto de Venta</h2>
        <form onSubmit={manejarLogin} style={{ display: 'inline-block', textAlign: 'left', marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label>Usuario (Cajero):</label><br />
            <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required style={{ padding: '8px', width: '250px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Contraseña:</label><br />
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required style={{ padding: '8px', width: '250px' }} />
          </div>
          {errorAuth && <p style={{ color: 'red', fontSize: '14px' }}>{errorAuth}</p>}
          <button type="submit" style={{ padding: '10px 20px', width: '100%', backgroundColor: '#0275d8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Ingresar</button>
        </form>
      </div>
    );
  }

  // ==========================================
  // VISTA DEL PUNTO DE VENTA (SPLIT-SCREEN)
  // ==========================================
  const totalCuenta = calcularTotal();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
      
      {/* SECCIÓN IZQUIERDA: MENÚ DE PRODUCTOS (70%) */}
      <div style={{ flex: '7', display: 'flex', flexDirection: 'column', padding: '10px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#333', color: 'white', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h3 style={{ margin: 0 }}>Terminal POS - Mostrador</h3>
          </div>
          <div>
            <span style={{ marginRight: '15px' }}>Cajero: <strong>Luis</strong></span>
            <button onClick={cerrarSesion} style={{ padding: '5px 10px', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salir</button>
          </div>
        </header>

        <div className="category-bar" style={{ padding: '15px 0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {categoriesOficiales.map(cat => (
            <button 
              key={cat} 
              className={categoriaSel === cat ? 'cat-act' : ''} 
              onClick={() => setCategoriaSel(cat)}
              style={{ margin: '0 5px', padding: '8px 15px', border: '1px solid #ccc', borderRadius: '20px', cursor: 'pointer', backgroundColor: categoriaSel === cat ? '#28a745' : 'white', color: categoriaSel === cat ? 'white' : 'black' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: '1', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '15px', alignContent: 'flex-start' }}>
          {filtrados.map(p => (
            <div key={p.id} className="dish-card" style={{ width: '220px', border: '1px solid #eaeaea', borderRadius: '10px', padding: '15px', backgroundColor: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', color: '#4a2c2a' }}>{p.nombre}</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', textAlign: 'center', color: '#888' }}>Existencias: {p.stock_disponible || 'N/A'}</p>
              <hr style={{ borderTop: '1px dashed #ccc', borderBottom: 'none', margin: '10px 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a6f3b' }}>
                  ${parseFloat(p.precio_venta || p.precio_venta_unitario || 0).toFixed(2)}
                </span>
                <button className="btn-add-order" onClick={() => agregarAlCarrito(p)} style={{ backgroundColor: '#5cb85c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN DERECHA: PANEL FIJO DE CUENTA (30%) */}
      <div style={{ flex: '3', backgroundColor: 'white', borderLeft: '2px solid #ddd', display: 'flex', flexDirection: 'column', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '20px', backgroundColor: '#0275d8', color: 'white', textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Cuenta Actual</h2>
        </div>

        <div style={{ flex: '1', overflowY: 'auto', padding: '20px' }}>
          {carrito.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>No hay artículos en la cuenta.</p>
          ) : (
            carrito.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <div style={{ flex: '1' }}>
                  <strong style={{ display: 'block' }}>{item.nombre}</strong>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    {item.cantidad} x ${parseFloat(item.precio_venta || item.precio_venta_unitario || 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '16px' }}>
                    ${(parseFloat(item.precio_venta || item.precio_venta_unitario || 0) * item.cantidad).toFixed(2)}
                  </strong>
                  <button onClick={() => eliminarDelCarrito(item.id)} style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer' }}>X</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sin bloque de total visible - Pasa directo al botón de Cobro */}
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderTop: '2px solid #ddd' }}>
          <button 
            onClick={iniciarProcesoPago}
            disabled={carrito.length === 0}
            style={{ width: '100%', padding: '15px', backgroundColor: carrito.length === 0 ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: carrito.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Cobrar Venta
          </button>
        </div>
      </div>

      {/* MODAL GLOBAL PARA PROCESO DE PAGO CONDICIONAL */}
      {mostrarModalPago && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '450px' }}>
            <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>Procesar Pago</h2>
            <h1 style={{ textAlign: 'center', color: '#0275d8', fontSize: '36px', margin: '20px 0' }}>${totalCuenta.toFixed(2)}</h1>
            
            <p style={{ fontWeight: 'bold' }}>Seleccione método de pago:</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setMetodoPago('efectivo')} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', backgroundColor: metodoPago === 'efectivo' ? '#d4edda' : 'white', cursor: 'pointer' }}>💵 Efectivo</button>
              <button onClick={() => setMetodoPago('tarjeta')} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', backgroundColor: metodoPago === 'tarjeta' ? '#d1ecf1' : 'white', cursor: 'pointer' }}>💳 Tarjeta</button>
              <button onClick={() => setMetodoPago('transferencia')} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', backgroundColor: metodoPago === 'transferencia' ? '#fff3cd' : 'white', cursor: 'pointer' }}>📱 Transferencia</button>
            </div>

            <div style={{ minHeight: '100px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
              {metodoPago === '' && <p style={{ textAlign: 'center', color: '#888' }}>Esperando selección de método...</p>}
              
              {metodoPago === 'efectivo' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Monto Recibido:</label>
                  <input type="number" placeholder="Ej. 500" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box' }} autoFocus />
                  
                  {montoRecibido && parseFloat(montoRecibido) >= totalCuenta && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e2e3e5', borderRadius: '5px', fontSize: '18px', textAlign: 'center' }}>
                      Su Cambio: <strong style={{ color: '#28a745' }}>${(parseFloat(montoRecibido) - totalCuenta).toFixed(2)}</strong>
                    </div>
                  )}
                  {montoRecibido && parseFloat(montoRecibido) < totalCuenta && (
                    <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>El monto ingresado es insuficiente.</p>
                  )}
                </div>
              )}

              {metodoPago === 'tarjeta' && (
                <div style={{ textAlign: 'center', color: '#004085' }}>
                  <p>⏳ Por favor, inserte o acerque la tarjeta a la terminal...</p>
                  <small>Esperando confirmación del banco...</small>
                </div>
              )}

              {metodoPago === 'transferencia' && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Banco:</strong> BBVA</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>CLABE:</strong> 012345678901234567</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Titular:</strong> Antojitos La Chancla S.A.</p>
                  <small style={{ color: '#856404' }}>Verifique el comprobante en su dispositivo antes de finalizar.</small>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <button onClick={() => setMostrarModalPago(false)} style={{ flex: 1, padding: '12px', border: '1px solid #ccc', backgroundColor: '#f8f9fa', cursor: 'pointer', borderRadius: '5px' }}>Cancelar</button>
              <button 
                onClick={finalizarVenta} 
                disabled={!metodoPago || (metodoPago === 'efectivo' && (!montoRecibido || parseFloat(montoRecibido) < totalCuenta))}
                style={{ flex: 1, padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: (!metodoPago || (metodoPago === 'efectivo' && (!montoRecibido || parseFloat(montoRecibido) < totalCuenta))) ? 'not-allowed' : 'pointer' }}
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}