import React, { useState } from 'react';
// IMPORTANTE: Los dos puntos (../) le dicen que salga de la carpeta components y entre a assets
import logo from '../assets/logo.png'; 

export default function VistaCliente({ platillos }) {
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const categoriasOficiales = ['Todos', 'Platillos Normales', 'Combos', 'Bebidas', 'Complementos'];

  const filtrados = categoriaSel === 'Todos' 
    ? platillos.filter(p => p.disponible)
    : platillos.filter(p => p.categoria === categoriaSel && p.disponible);

  return (
    <div className="view-pane client-theme">
      <header className="restaurant-header">
        <img src={logo} alt="La Chancla" className="main-logo" />
        <p className="slogan">"El Sabor que te pega!"</p>
        <div className="badge-client">MENÚ DIGITAL DE CLIENTES</div>
      </header>

      <div className="category-bar">
        {categoriasOficiales.map(cat => (
          <button 
            key={cat} 
            className={categoriaSel === cat ? 'cat-act' : ''} 
            onClick={() => setCategoriaSel(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

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
                <p className="desc">{p.descripcion}</p>
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