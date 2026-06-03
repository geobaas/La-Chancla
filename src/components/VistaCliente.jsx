import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Importamos la verificación de sesión

export default function VistaCliente({ platillos }) {
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [datosClima, setDatosClima] = useState(null);
  
  // ==========================================
  // ESTADOS DEL CARRITO Y SESIÓN
  // ==========================================
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const categoriesOficiales = ['Todos', 'Platillos', 'Combos', 'Bebidas', 'Complementos', 'Postres'];

  const filtrados = categoriaSel === 'Todos' 
    ? platillos.filter(p => p.disponible)
    : platillos.filter(p => p.id_categoria === categoriaSel && p.disponible);

  // Verificar si hay alguien logueado al abrir la página
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioLogueado(user);
    });
    return () => unsubscribe();
  }, []);

  // Clima de Valladolid
  useEffect(() => {
    const cargarClima = async () => {
      const ciudad = "Valladolid,MX";
      const apiKey = "30f4d37802fd54860288c7d74793b453"; 
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`;
      
      try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo obtener el clima");
        
        const datos = await respuesta.json();
        const temperatura = Math.round(datos.main.temp);
        const descripcion = datos.weather[0].description;
        
        let recomendacion = "";
        if (temperatura > 30) {
          recomendacion = "¡Día muy caluroso! ☀️ Acompaña tus antojitos con un agua de horchata bien fría.";
        } else if (temperatura < 22) {
          recomendacion = "¡El clima está fresco! ☁️ Ideal para entrar en calor con unos tacos de cochinita.";
        } else {
          recomendacion = "¡Clima perfecto en Valladolid! 🌮 Disfruta de nuestro menú al máximo hoy.";
        }

        setDatosClima({
          texto: `${temperatura}°C, ${descripcion}`,
          recomendacion: recomendacion,
          icono: `https://openweathermap.org/img/wn/${datos.weather[0].icon}.png`
        });
      } catch (error) {
        console.error("Error al cargar clima:", error);
      }
    };
    cargarClima();
  }, []);

  // ==========================================
  // LÓGICA DEL CARRITO
  // ==========================================
  const agregarAlCarrito = (platillo) => {
    // REGLA DE NEGOCIO: Proteger el carrito para usuarios no registrados
    if (!usuarioLogueado) {
      alert("🔒 ¡Ups! Necesitas iniciar sesión en el menú principal para poder hacer un pedido.");
      return;
    }

    // Si está logueado, verificamos si el platillo ya está en el carrito
    const itemExistente = carrito.find(item => item.id === platillo.id);
  
    if (itemExistente) {
      // Si ya existe, le sumamos 1 a la cantidad
      setCarrito(carrito.map(item => 
        item.id === platillo.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      // Si es nuevo, lo agregamos con cantidad 1
      setCarrito([...carrito, { ...platillo, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (idPlatillo) => {
    setCarrito(carrito.filter(item => item.id !== idPlatillo));
  };

  const calcularTotalCarrito = () => {
    return carrito.reduce((total, item) => total + (parseFloat(item.precio_venta || item.precio_venta_unitario || 0) * item.cantidad), 0);
  };

  const enviarPedido = () => {
    alert("✅ ¡Tu pedido ha sido enviado a cocina! Pronto lo llevaremos a tu mesa.");
    setCarrito([]); // Vaciamos el carrito después de cobrar
    setMostrarCarrito(false);
  };

  return (
    <div className="view-pane client-theme">
      <header className="restaurant-header">
        <img src={logo} alt="Antojitos La Chancla" className="main-logo" />
        <p className="slogan">"El Sabor que te pega!"</p>
        <div className="badge-client">MENÚ DIGITAL DE CLIENTES</div>
      </header>

      {/* WIDGET DEL CLIMA */}
      {datosClima && (
        <div className="widget-clima">
          <div className="clima-header">
            <img src={datosClima.icono} alt="Icono clima" className="clima-icono" />
            <strong>Clima actual:</strong> <span>{datosClima.texto}</span>
          </div>
          <p className="clima-recomendacion"><em>{datosClima.recomendacion}</em></p>
        </div>
      )}

      {/* BARRA DE CATEGORÍAS */}
      <div className="category-bar">
        {categoriesOficiales.map(cat => (
          <button key={cat} className={categoriaSel === cat ? 'cat-act' : ''} onClick={() => setCategoriaSel(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* GRID DINÁMICO DEL MENÚ */}
      <div className="menu-grid">
        {filtrados.length === 0 ? (
          <p className="no-items">Próximamente agregaremos deliciosos platillos a esta sección...</p>
        ) : (
          filtrados.map(p => (
            <div key={p.id} className="dish-card">
              <div className="image-placeholder" style={{backgroundImage: `url(${p.imagen_url || 'https://via.placeholder.com/300x200?text=La+Chancla+Restaurante'})`}}>
                {p.es_picante && <span className="spicy-tag">🌶️ Picante</span>}
                {p.stock_disponible <= 3 && p.stock_disponible > 0 && <span className="low-stock-tag">¡Pocas piezas!</span>}
              </div>
              
              <div className="dish-info">
                <h3>{p.nombre}</h3>
                <p className="desc">{p.descripcion || 'Sin descripción disponible por el momento.'}</p>
                <div className="card-footer">
                  <span className="price">${parseFloat(p.precio_venta || p.precio_venta_unitario || 0).toFixed(2)} MXN</span>
                  {/* BOTÓN CONECTADO A LA FUNCIÓN DEL CARRITO */}
                  <button className="btn-add-order" onClick={() => agregarAlCarrito(p)}>Añadir ➕</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTÓN FLOTANTE DEL CARRITO (Solo aparece si hay items) */}
      {carrito.length > 0 && (
        <button className="btn-flotante-carrito" onClick={() => setMostrarCarrito(true)}>
          🛒 Ver Carrito ({carrito.reduce((acc, item) => acc + item.cantidad, 0)})
        </button>
      )}

      {/* VENTANA EMERGENTE (MODAL) DEL CARRITO */}
      {mostrarCarrito && (
        <div className="modal-carrito-overlay">
          <div className="modal-carrito-contenido">
            <h2>🛒 Tu Pedido</h2>
            <div className="lista-carrito">
              {carrito.map((item, index) => (
                <div key={index} className="item-carrito">
                  <div className="item-carrito-info">
                    <strong>{item.cantidad}x {item.nombre}</strong>
                    <span>${(parseFloat(item.precio_venta || item.precio_venta_unitario || 0) * item.cantidad).toFixed(2)}</span>
                  </div>
                  <button className="btn-eliminar-item" onClick={() => eliminarDelCarrito(item.id)}>❌</button>
                </div>
              ))}
            </div>
            
            <div className="carrito-total">
              <h3>Total a Pagar: ${calcularTotalCarrito().toFixed(2)} MXN</h3>
            </div>
            
            <div className="carrito-acciones">
              <button className="btn-cerrar-modal" onClick={() => setMostrarCarrito(false)}>Seguir Comprando</button>
              <button className="btn-confirmar-pedido" onClick={enviarPedido}>Confirmar Pedido 🌮</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}