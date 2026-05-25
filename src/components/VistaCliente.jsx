import React, { useState } from 'react';
import logo from '../assets/logo.png'; // Ruta correcta saliendo a assets

export default function VistaCliente({ platillos }) {
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  
  // Categorías oficiales basadas en el diseño de tu base de datos
  const categoriesOficiales = ['Todos', 'Platillos', 'Combos', 'Bebidas', 'Complementos', 'Postres'];

  // Filtrado modificado para evaluar id_categoria
  const filtrados = categoriaSel === 'Todos' 
    ? platillos.filter(p => p.disponible)
    : platillos.filter(p => p.id_categoria === categoriaSel && p.disponible);

  return (
    <div className="view-pane client-theme">
      <header className="restaurant-header">
        <img src={logo} alt="Antojitos La Chancla" className="main-logo" />
        <p className="slogan">"El Sabor que te pega!"</p>
        <div className="badge-client">MENÚ DIGITAL DE CLIENTES</div>
      </header>

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