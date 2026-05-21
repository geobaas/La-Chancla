import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import logo from './assets/logo.png';
import './App.css';

function App() {
  const [platillos, setPlatillos] = useState([]);
  
  // ESTADOS DE SEGURIDAD
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [rolActual, setRolActual] = useState('cliente'); 
  
  // ESTADOS DEL MODAL DE LOGIN
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [tipoLogin, setTipoLogin] = useState('cliente'); // 'cliente' o 'empleado'
  const [isRegistering, setIsRegistering] = useState(false);
  
  // CAMPOS DE FORMULARIO
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameEmpleado, setUsernameEmpleado] = useState(''); // Solo para empleados

  // 1. Cargar datos del Menú
  useEffect(() => {
    const q = collection(db, "menu");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach((docItem) => docs.push({ ...docItem.data(), id: docItem.id }));
      setPlatillos(docs);
    });
    return () => unsubscribe();
  }, []);

  // 2. Escuchar cambios de Sesión
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUsuarioActual(user);
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setRolActual(docSnap.data().rol); 
        } else {
          await setDoc(docRef, { email: user.email, rol: 'cliente' });
          setRolActual('cliente');
        }
      } else {
        setRolActual('cliente'); 
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Funciones de Login / Registro
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (tipoLogin === 'cliente') {
        if (isRegistering) {
          await createUserWithEmailAndPassword(auth, email, password);
          alert("Cuenta de cliente creada exitosamente.");
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } else {
        // MAGIA PARA EMPLEADOS: Enmascaramos el usuario como un correo interno
        const correoInterno = `${usernameEmpleado.toLowerCase().trim()}@lachancla.interno`;
        await signInWithEmailAndPassword(auth, correoInterno, password);
      }
      
      // Limpiar y cerrar modal
      setMostrarLogin(false);
      setEmail(''); setPassword(''); setUsernameEmpleado('');
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("Credenciales incorrectas. Verifica tus datos.");
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  // Función para recuperar contraseña (Solo Clientes)
  const handleRecuperarPassword = async () => {
    if (!email) {
      alert("Por favor, escribe tu correo electrónico en el campo de arriba para enviarte el enlace de recuperación.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("¡Listo! Te hemos enviado un enlace de recuperación a tu correo.");
    } catch (error) {
      alert("Error al enviar el correo: " + error.message);
    }
  };

  const cerrarSesion = async () => {
    await signOut(auth);
  };

  return (
    <div className="app-container">
      {/* BARRA DE ESTADO DEL USUARIO */}
      <div className="auth-top-bar">
        {usuarioActual ? (
          <div className="user-info">
            <span>👤 Conectado como: <strong>{usuarioActual.email.replace('@lachancla.interno', '')}</strong> (Área: {rolActual.toUpperCase()})</span>
            <button className="btn-logout" onClick={cerrarSesion}>Cerrar Sesión</button>
          </div>
        ) : (
          <button className="btn-login-trigger" onClick={() => setMostrarLogin(true)}>👤 Iniciar Sesión</button>
        )}
      </div>

      {/* MODAL DE LOGIN INTELIGENTE */}
      {mostrarLogin && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            {/* Pestañas de Tipo de Usuario */}
            <div className="login-tabs">
              <button className={tipoLogin === 'cliente' ? 'tab-active' : ''} onClick={() => {setTipoLogin('cliente'); setIsRegistering(false);}}>Soy Cliente</button>
              <button className={tipoLogin === 'empleado' ? 'tab-active' : ''} onClick={() => {setTipoLogin('empleado'); setIsRegistering(false);}}>Acceso Personal</button>
            </div>

            <form onSubmit={handleAuth} className="login-form">
              {tipoLogin === 'cliente' ? (
                <>
                  <h3>{isRegistering ? 'Crear Cuenta' : 'Bienvenido de nuevo'}</h3>
                  <input type="email" placeholder="Tu Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
                  <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                  
                  {!isRegistering && (
                    <p className="forgot-password" onClick={handleRecuperarPassword}>¿Olvidaste tu contraseña?</p>
                  )}
                  
                  <button type="submit" className="btn-submit-login">{isRegistering ? 'Registrarme' : 'Entrar'}</button>
                  
                  <p className="toggle-login" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? '¿Ya tienes cuenta? Entra aquí.' : '¿Eres nuevo? Regístrate aquí.'}
                  </p>
                </>
              ) : (
                <>
                  <h3>Portal de Empleados</h3>
                  <p className="employee-warning">Área restringida. Solo personal autorizado.</p>
                  <input type="text" placeholder="Usuario (Ej: antonio, luis)" value={usernameEmpleado} onChange={e => setUsernameEmpleado(e.target.value)} required />
                  <input type="password" placeholder="Contraseña asignada" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="submit" className="btn-submit-login employee-btn">Acceder al Sistema</button>
                </>
              )}
            </form>
            <button className="btn-close-modal" onClick={() => setMostrarLogin(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* RENDERIZADO ESTRICTO SEGÚN ROL */}
      {rolActual === 'cliente' && <VistaCliente platillos={platillos} />}
      {rolActual === 'mostrador' && <VistaMostrador platillos={platillos} />}
      {rolActual === 'gerencia' && <VistaGerencia platillos={platillos} />}
    </div>
  );
}

/* ==========================================
   (Las 3 Vistas: Cliente, Mostrador y Gerencia se quedan EXACTAMENTE igual que en mi respuesta anterior)
   Pega aquí abajo las funciones VistaCliente, VistaMostrador y VistaGerencia que ya tenías.
   ========================================== */
function VistaCliente({ platillos }) {
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const categoriasOficiales = ['Todos', 'Platillos Normales', 'Combos', 'Bebidas', 'Complementos'];

  const filtrados = categoriaSel === 'Todos' 
    ? platillos.filter(p => p.disponible)
    : platillos.filter(p => p.categoria === categoriaSel && p.disponible);

  return (
    <div className="view-pane client-theme">
      <header className="restaurant-header">
        <img src={logo} alt="Antojitos La Chancla" className="main-logo" />
        <p className="slogan">"El Sabor que te pega!"</p>
        <div className="badge-client">MENÚ DIGITAL DE CLIENTES</div>
      </header>

      <div className="category-bar">
        {categoriasOficiales.map(cat => (
          <button key={cat} className={categoriaSel === cat ? 'cat-act' : ''} onClick={() => setCategoriaSel(cat)}>{cat}</button>
        ))}
      </div>

      <div className="menu-grid">
        {filtrados.length === 0 ? (
          <p className="no-items">Próximamente agregaremos deliciosos platillos a esta sección...</p>
        ) : (
          filtrados.map(p => (
            <div key={p.id} className="dish-card">
              <div className="image-placeholder" style={{backgroundImage: `url(${p.imagen_url || 'https://via.placeholder.com/300x200?text=La+Chancla+Restaurante'})`}}>
                {p.es_picante && <span className="spicy-tag">🌶️ Picante</span>}
              </div>
              <div className="dish-info">
                <h3>{p.nombre}</h3>
                <p className="desc">{p.descripcion}</p>
                <div className="card-footer">
                  <span className="price">${parseFloat(p.precio_venta).toFixed(2)} MXN</span>
                  {p.stock_disponible <= 3 && p.stock_disponible > 0 && <span className="low-stock-tag">¡Pocas piezas!</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VistaMostrador({ platillos }) {
  const [pedido, setPedido] = useState([]);
  const agregarAlPedido = (p) => {
    const existe = pedido.find(item => item.id === p.id);
    if (existe) setPedido(pedido.map(item => item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    else setPedido([...pedido, { ...p, cantidad: 1 }]);
  };
  const total = pedido.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);

  return (
    <div className="view-pane mostrador-theme">
      <h2>PUNTO DE VENTA (MOSTRADOR)</h2>
      <div className="pos-layout">
        <div className="pos-products">
          <div className="pos-grid">
            {platillos.map(p => (
              <button key={p.id} className="pos-item-btn" onClick={() => agregarAlPedido(p)} disabled={!p.disponible || p.stock_disponible <= 0}>
                {p.nombre} <br /> <strong>${p.precio_venta}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="pos-ticket">
          <h3>Ticket Actual</h3>
          <div className="ticket-lines">
            {pedido.map(item => (
              <div key={item.id} className="ticket-line"><span>{item.cantidad}x {item.nombre}</span><span>${(item.precio_venta * item.cantidad).toFixed(2)}</span></div>
            ))}
          </div>
          <div className="ticket-total">TOTAL: ${total.toFixed(2)}</div>
          <button className="btn-send-order" onClick={() => { alert("Pedido Guardado"); setPedido([]); }}>Despachar e Imprimir</button>
        </div>
      </div>
    </div>
  );
}

function VistaGerencia({ platillos }) {
  const [form, setForm] = useState({ nombre: '', precio_venta: '', costo_insumo: '', categoria: 'Platillos Normales', descripcion: '', stock_disponible: '', es_picante: false, disponible: true, imagen_url: '' });
  const [editId, setEditId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, precio_venta: parseFloat(form.precio_venta), costo_insumo: parseFloat(form.costo_insumo), stock_disponible: parseInt(form.stock_disponible) };
    if (editId) { await updateDoc(doc(db, "menu", editId), data); setEditId(null); } 
    else { await addDoc(collection(db, "menu"), { ...data, popularidad: 0 }); }
    setForm({ nombre: '', precio_venta: '', costo_insumo: '', categoria: 'Platillos Normales', descripcion: '', stock_disponible: '', es_picante: false, disponible: true, imagen_url: '' });
  };
  const handleEdit = (p) => { setEditId(p.id); setForm(p); };
  const handleDelete = async (id) => { if(window.confirm("¿Eliminar platillo?")) await deleteDoc(doc(db, "menu", id)); };

  return (
    <div className="view-pane gerencia-theme">
      <h2>PANEL GERENCIAL</h2>
      <div className="management-workspace">
        <form onSubmit={handleSubmit} className="crud-form">
          <input type="text" placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
          <select className="crud-select" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
            <option value="Platillos Normales">Platillos Normales</option><option value="Combos">Combos</option><option value="Bebidas">Bebidas</option><option value="Complementos">Complementos</option>
          </select>
          <input type="number" step="0.1" placeholder="Precio ($)" value={form.precio_venta} onChange={e => setForm({...form, precio_venta: e.target.value})} required />
          <input type="number" step="0.1" placeholder="Costo ($)" value={form.costo_insumo} onChange={e => setForm({...form, costo_insumo: e.target.value})} required />
          <textarea placeholder="Descripción..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} required />
          <input type="number" placeholder="Stock" value={form.stock_disponible} onChange={e => setForm({...form, stock_disponible: e.target.value})} required />
          <button type="submit" className="btn-save">Guardar</button>
        </form>
        <div className="crud-table-container">
          <table className="crud-table">
            <thead><tr><th>Nombre</th><th>Cat.</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
            <tbody>
              {platillos.map(p => (
                <tr key={p.id}><td>{p.nombre}</td><td>{p.categoria}</td><td>${p.precio_venta}</td><td>{p.stock_disponible}</td>
                <td><button className="btn-edit" onClick={() => handleEdit(p)}>Edit</button><button className="btn-delete" onClick={() => handleDelete(p.id)}>Del</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;