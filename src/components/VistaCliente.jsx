import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png'; 

export default function VistaCliente({ platillos }) {
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [datosClima, setDatosClima] = useState(null);
  
  // Categorías oficiales
  const categoriesOficiales = ['Todos', 'Platillos', 'Combos', 'Bebidas', 'Complementos', 'Postres'];

  // Filtrado de platillos
  const filtrados = categoriaSel === 'Todos' 
    ? platillos.filter(p => p.disponible)
    : platillos.filter(p => p.id_categoria === categoriaSel && p.disponible);

  // ==========================================
  // SERVICIO EN LA NUBE: OPENWEATHERMAP
  // ==========================================
  useEffect(() => {
    const cargarClima = async () => {
      const ciudad = "Valladolid,MX";
      const apiKey = "30f4d37802fd54860288c7d74793b453"; // Tu API Key real de OpenWeatherMap
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`;
      
      try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("No se pudo obtener el clima");
        
        const datos = await respuesta.json();
        const temperatura = Math.round(datos.main.temp);
        const descripcion = datos.weather[0].description;
        
        let recomendacion = "";
        
        // Lógica de recomendación de negocio (Taquería/Antojitos)
        if (temperatura > 30) {
          recomendacion = "¡Día muy caluroso! ☀️ Acompaña tus antojitos con un agua de horchata bien fría o un refresco con hielo.";
        } else if (temperatura < 22) {
          recomendacion = "¡El clima está fresco! ☁️ Ideal para entrar en calor con unos tacos de cochinita recién salidos.";
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

  return (
    <div className="view-pane client-theme">
      <header className="restaurant-header">
        <img src={logo} alt="Antojitos La Chancla" className="main-logo" />
        <p className="slogan">"El Sabor que te pega!"</p>
        <div className="badge-client">MENÚ DIGITAL DE CLIENTES</div>
      </header>

      {/* WIDGET DEL CLIMA (NUEVO SERVICIO EN LA NUBE) */}
      {datosClima && (
        <div className="widget-clima">
          <div className="clima-header">
            <img src={datosClima.icono} alt="Icono clima" className="clima-icono" />
            <strong>Clima actual en Valladolid:</strong> <span>{datosClima.texto}</span>
          </div>
          <p className="clima-recomendacion"><em>{datosClima.recomendacion}</em></p>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN POR CHIPS */}
      <div className="category-bar">
        {categoriesOficiales.map(cat => (
          <button 
            key={cat} 
            className={categoriaSel === cat ? 'cat-act' : ''} 
            onClick={() => setCategoriaSel(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID DINÁMICO DE TARJETAS */}
      <div className="menu-grid">
        {filtrados.length === 0 ? (
          <p className="no-items">Próximamente agregaremos deliciosos platillos a esta sección...</p>
        ) : (
          filtrados.map(p => (
            <div key={p.id} className="dish-card">
              <div 
                className="image-placeholder" 
                style={{backgroundImage: `url(${p.imagen_url || 'https://via.placeholder.com/300x200?text=La+Chancla+Restaurante'})`}}
              >
                {p.es_picante && <span className="spicy-tag">🌶️ Picante</span>}
                {p.stock_disponible <= 3 && p.stock_disponible > 0 && <span className="low-stock-tag">¡Pocas piezas!</span>}
              </div>
              
              <div className="dish-info">
                <h3>{p.nombre}</h3>
                <p className="desc">{p.descripcion || 'Sin descripción disponible por el momento.'}</p>
                <div className="card-footer">
                  <span className="price">${parseFloat(p.precio_venta).toFixed(2)} MXN</span>
                  <button className="btn-add-order">Añadir ➕</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}