import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
// IMPORTAMOS EL NUEVO COMPONENTE MODULAR

import VistaReportesBI from './VistaReportesBI';

export default function VistaGerencia({ platillos }) {
  const [vistaActual, setVistaActual] = useState('inicio'); 
  const [categorias, setCategorias] = useState([]);

  const [formPlatillo, setFormPlatillo] = useState({
    nombre: '', precio_venta: '', costo_produccion: '', id_categoria: '', 
    descripcion: '', stock_disponible: '', es_picante: false, disponible: true, imagen_url: ''
  });
  const [editId, setEditId] = useState(null);

  const [formCategoria, setFormCategoria] = useState({
    nombre: '', orden_visual: 1, estatus: true
  });

  useEffect(() => {
    const q = collection(db, "menu_categorias");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = [];
      snapshot.forEach((doc) => cats.push({ id: doc.id, ...doc.data() }));
      cats.sort((a, b) => a.orden_visual - b.orden_visual);
      setCategorias(cats);

      if (cats.length > 0 && !formPlatillo.id_categoria) {
        setFormPlatillo(prev => ({ ...prev, id_categoria: cats[0].nombre }));
      }
    });
    return () => unsubscribe();
  }, [formPlatillo.id_categoria]);

  // --- FUNCIONES PARA PLATILLOS ---
  const handlePlatilloSubmit = async (e) => {
    e.preventDefault();
    const data = { 
      ...formPlatillo, 
      precio_venta: parseFloat(formPlatillo.precio_venta), 
      costo_produccion: parseFloat(formPlatillo.costo_produccion), 
      stock_disponible: parseInt(formPlatillo.stock_disponible) 
    };
    
    if (editId) { 
      await updateDoc(doc(db, "menu_items", editId), data); 
      setEditId(null); 
    } else { 
      await addDoc(collection(db, "menu_items"), { ...data, popularidad: 0 }); 
    }
    
    setFormPlatillo({ nombre: '', precio_venta: '', costo_produccion: '', id_categoria: categorias.length > 0 ? categorias[0].nombre : '', descripcion: '', stock_disponible: '', es_picante: false, disponible: true, imagen_url: '' });
    alert("Platillo guardado correctamente.");
    setVistaActual('verMenu'); 
  };

  const handleEditPlatillo = (p) => { setEditId(p.id); setFormPlatillo(p); setVistaActual('agregarPlatillo'); };
  const handleDeletePlatillo = async (id) => { if(window.confirm("¿Eliminar platillo de la base de datos?")) await deleteDoc(doc(db, "menu_items", id)); };

  const handleCategoriaSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "menu_categorias"), {
      nombre: formCategoria.nombre,
      orden_visual: parseInt(formCategoria.orden_visual),
      estatus: formCategoria.estatus
    });
    setFormCategoria({ nombre: '', orden_visual: categorias.length + 1, estatus: true });
    alert("Categoría creada exitosamente.");
    setVistaActual('inicio');
  };

  return (
    <div className="view-pane gerencia-theme">
      <div className="management-header">
        <h2>PANEL GERENCIAL</h2>
        {vistaActual !== 'inicio' && (
          <button className="btn-back" onClick={() => { setVistaActual('inicio'); setEditId(null); }}>
            ⬅️ Volver al Menú
          </button>
        )}
      </div>

      <div className="management-workspace">
        {/* VISTA 1: MENÚ PRINCIPAL */}
        {vistaActual === 'inicio' && (
          <div className="dashboard-inicio">
            <h1 className="greeting-text">Hola, ¿qué deseas hacer hoy? 👋</h1>
            <div className="dashboard-grid">
              <button className="dash-action-btn" onClick={() => setVistaActual('agregarPlatillo')}><span className="icon">🌮</span><h3>Agregar Platillo</h3><p>Registra un nuevo producto para la venta</p></button>
              <button className="dash-action-btn" onClick={() => setVistaActual('crearCategoria')}><span className="icon">📁</span><h3>Crear Categoría</h3><p>Añade secciones (Ej. Bebidas, Combos)</p></button>
              <button className="dash-action-btn" onClick={() => setVistaActual('verMenu')}><span className="icon">📋</span><h3>Gestionar Menú</h3><p>Edita inventario o elimina platillos</p></button>
              <button className="dash-action-btn" onClick={() => setVistaActual('agregarProveedor')}><span className="icon">🚚</span><h3>Agregar Proveedor</h3><p>Gestiona los proveedores de insumos</p></button>
              <button className="dash-action-btn" onClick={() => setVistaActual('ventas')}><span className="icon">🧾</span><h3>Ventas</h3><p>Historial de transacciones y tickets</p></button>
              <button className="dash-action-btn" onClick={() => setVistaActual('reporteBI')}><span className="icon">📊</span><h3>Reportes BI</h3><p>Inteligencia de negocios y métricas</p></button>
            </div>
          </div>
        )}

        {/* --- VISTAS EXISTENTES --- */}
        {vistaActual === 'crearCategoria' && (
          <div className="form-container">
            <h3>Crear Nueva Categoría</h3>
            <form onSubmit={handleCategoriaSubmit} className="crud-form">
              <input type="text" placeholder="Nombre de la categoría (Ej. Entradas)" value={formCategoria.nombre} onChange={e => setFormCategoria({...formCategoria, nombre: e.target.value})} required />
              <input type="number" placeholder="Orden de aparición (Ej. 1, 2, 3...)" value={formCategoria.orden_visual} onChange={e => setFormCategoria({...formCategoria, orden_visual: e.target.value})} required />
              <div className="checkbox-group">
                <label>
                  <input type="checkbox" checked={formCategoria.estatus} onChange={e => setFormCategoria({...formCategoria, estatus: e.target.checked})} />
                  Categoría Activa (Visible al público)
                </label>
              </div>
              <button type="submit" className="btn-save">Guardar Categoría</button>
            </form>
          </div>
        )}

        {vistaActual === 'agregarPlatillo' && (
          <div className="form-container">
            <h3>{editId ? 'Editar Platillo' : 'Agregar Nuevo Platillo'}</h3>
            <form onSubmit={handlePlatilloSubmit} className="crud-form">
              <input type="text" placeholder="Nombre del Platillo" value={formPlatillo.nombre} onChange={e => setFormPlatillo({...formPlatillo, nombre: e.target.value})} required />
              <select className="crud-select" value={formPlatillo.id_categoria} onChange={e => setFormPlatillo({...formPlatillo, id_categoria: e.target.value})} required>
                {categorias.length === 0 && <option value="">Cargando categorías...</option>}
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
              <input type="number" step="0.1" placeholder="Precio Venta ($)" value={formPlatillo.precio_venta} onChange={e => setFormPlatillo({...formPlatillo, precio_venta: e.target.value})} required />
              <input type="number" step="0.1" placeholder="Costo Producción ($)" value={formPlatillo.costo_produccion} onChange={e => setFormPlatillo({...formPlatillo, costo_produccion: e.target.value})} required />
              <textarea placeholder="Descripción del platillo..." value={formPlatillo.descripcion} onChange={e => setFormPlatillo({...formPlatillo, descripcion: e.target.value})} required />
              <input type="number" placeholder="Stock Disponible" value={formPlatillo.stock_disponible} onChange={e => setFormPlatillo({...formPlatillo, stock_disponible: e.target.value})} required />
              <input type="url" placeholder="URL de la imagen (Ej: https://...)" value={formPlatillo.imagen_url} onChange={e => setFormPlatillo({...formPlatillo, imagen_url: e.target.value})} />
              <div className="checkbox-group">
                <label><input type="checkbox" checked={formPlatillo.es_picante} onChange={e => setFormPlatillo({...formPlatillo, es_picante: e.target.checked})} /> ¿Es picante? 🌶️</label>
                <label><input type="checkbox" checked={formPlatillo.disponible} onChange={e => setFormPlatillo({...formPlatillo, disponible: e.target.checked})} /> ¿Está disponible para venta?</label>
              </div>
              <button type="submit" className="btn-save">{editId ? 'Actualizar Platillo' : 'Guardar Nuevo Platillo'}</button>
            </form>
          </div>
        )}

        {vistaActual === 'verMenu' && (
          <div className="crud-table-container">
            <h3>Platillos Registrados</h3>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {platillos.map(p => (
                  <tr key={p.id}>
                    <td>{p.nombre} {p.es_picante && '🌶️'}</td>
                    <td>{p.id_categoria}</td> 
                    <td>${p.precio_venta}</td>
                    <td>{p.stock_disponible || 'N/A'}</td>
                    <td>{p.disponible ? '🟢 Activo' : '🔴 Inactivo'}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEditPlatillo(p)}>Editar</button>
                      <button className="btn-delete" onClick={() => handleDeletePlatillo(p.id)}>Borrar</button>
                    </td>
                  </tr>
                ))}
                {platillos.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#888'}}>No hay platillos registrados todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VISTAS PLACEHOLDERS */}
        {vistaActual === 'agregarProveedor' && (
          <div className="form-container">
            <h3>Agregar Nuevo Proveedor</h3>
            <div style={{textAlign: 'center', padding: '40px', color: '#d84315', background: '#fffaf2', borderRadius: '12px', border: '2px dashed #ffe0b2'}}>
              <span style={{fontSize: '3rem'}}>🚚</span>
              <p style={{marginTop: '15px', fontWeight: 'bold'}}>Módulo de Proveedores en construcción...</p>
            </div>
          </div>
        )}

        {vistaActual === 'ventas' && (
          <div className="crud-table-container">
            <h3>Historial de Ventas</h3>
            <div style={{textAlign: 'center', padding: '40px', color: '#d84315', background: '#fffaf2', borderRadius: '12px', border: '2px dashed #ffe0b2'}}>
              <span style={{fontSize: '3rem'}}>🧾</span>
              <p style={{marginTop: '15px', fontWeight: 'bold'}}>Conectando con la colección "ventas_historicas"...</p>
            </div>
          </div>
        )}

        {/* AQUI MANDAMOS LLAMAR AL NUEVO COMPONENTE EXTERNO */}
        {vistaActual === 'reporteBI' && <VistaReportesBI />}

      </div>
    </div>
  );
}