import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function VistaGerencia({ platillos }) {
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