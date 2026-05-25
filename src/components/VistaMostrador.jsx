import React, { useState } from 'react';

export default function VistaMostrador({ platillos }) {
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