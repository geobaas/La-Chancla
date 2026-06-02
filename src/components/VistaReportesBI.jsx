import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
// Eliminados Line y LineChart para que Netlify compile sin problemas
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from 'recharts';

export default function VistaReportesBI() {
  // Estado para controlar qué pestaña se está viendo (del 1 al 4)
  const [pestañaActiva, setPestañaActiva] = useState(1);

  // ==========================================
  // ESTADOS PARA LOS DASHBOARDS
  // ==========================================
  const [ventasTotales, setVentasTotales] = useState(0);
  const [datosMetodoPago, setDatosMetodoPago] = useState([]);
  const [datosPorHora, setDatosPorHora] = useState([]);
  const META_SEMANAL = 15000; 

  const [datosTopPlatillos, setDatosTopPlatillos] = useState([]);
  const [datosCategorias, setDatosCategorias] = useState([]);
  const [tablaRentabilidad, setTablaRentabilidad] = useState([]);

  const [alertasStock, setAlertasStock] = useState([]);
  const [datosProveedores, setDatosProveedores] = useState([]);

  const [tiempoPromedio, setTiempoPromedio] = useState(0);
  const [satisfaccionPromedio, setSatisfaccionPromedio] = useState(0);
  const [mapaCalor, setMapaCalor] = useState([]);

  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#F06292'];

  // ==========================================
  // CONEXIÓN A FIRESTORE
  // ==========================================
  useEffect(() => {
    const unsubVentas = onSnapshot(collection(db, "ventas_historicas"), (snapshot) => {
      let acumuladoVentas = 0, sumaTiempos = 0, conteoTiempos = 0, sumaSatisfaccion = 0, conteoClientes = 0;
      const cMetodos = {}, cHoras = {}, cPlatillos = {}, cCategorias = {}, cRentabilidad = {}, cAfluencia = {};

      snapshot.forEach((doc) => {
        const ticket = doc.data();
        const subtotal = Number(ticket.subtotal_venta) || 0;
        
        acumuladoVentas += subtotal;
        const metodo = ticket.metodo_pago || 'Efectivo';
        cMetodos[metodo] = (cMetodos[metodo] || 0) + subtotal;
        
        const hora = ticket.hora || 12; 
        cHoras[hora] = (cHoras[hora] || 0) + subtotal;

        const platillo = ticket.nombre_platillo;
        if (platillo) {
           const cantidad = Number(ticket.cantidad_vendida) || 1;
           const costo = Number(ticket.costo_ingredientes) || 0;
           const precio = Number(ticket.precio_venta_unitario) || 0;
           
           cPlatillos[platillo] = (cPlatillos[platillo] || 0) + cantidad;
           cRentabilidad[platillo] = { 
             nombre: platillo, costo: costo, precio: precio, margen: (precio - costo).toFixed(2)
           };
        }

        const categoria = ticket.categoria;
        if (categoria) cCategorias[categoria] = (cCategorias[categoria] || 0) + 1;

        if (ticket.tiempo_preparacion) {
          sumaTiempos += Number(ticket.tiempo_preparacion);
          conteoTiempos++;
        }
        if (ticket.calificacion_cliente) {
          sumaSatisfaccion += Number(ticket.calificacion_cliente);
          conteoClientes++;
        }

        const dia = ticket.dia_semana || 'Lunes';
        const keyAfluencia = `${dia}-${hora}`;
        cAfluencia[keyAfluencia] = { dia, hora, pedidos: (cAfluencia[keyAfluencia]?.pedidos || 0) + 1 };
      });

      setVentasTotales(acumuladoVentas);
      setDatosMetodoPago(Object.keys(cMetodos).map(k => ({ name: k, value: cMetodos[k] })));
      
      const horasArray = Object.keys(cHoras).map(k => ({ hora: `${k}:00`, ventas: cHoras[k] })).sort((a,b) => parseInt(a.hora) - parseInt(b.hora));
      setDatosPorHora(horasArray);

      setDatosTopPlatillos(Object.keys(cPlatillos).map(k => ({ name: k, cantidad: cPlatillos[k] })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5));
      setTablaRentabilidad(Object.values(cRentabilidad).sort((a,b) => b.margen - a.margen).slice(0, 5));
      setDatosCategorias(Object.keys(cCategorias).map(k => ({ name: k, value: cCategorias[k] })));

      setTiempoPromedio(conteoTiempos > 0 ? (sumaTiempos / conteoTiempos).toFixed(1) : 0);
      setSatisfaccionPromedio(conteoClientes > 0 ? (sumaSatisfaccion / conteoClientes).toFixed(1) : 0);
      setMapaCalor(Object.values(cAfluencia));
    });

    const unsubInventario = onSnapshot(collection(db, "menu_items"), (snapshot) => {
      const criticos = [];
      snapshot.forEach((doc) => {
        const item = doc.data();
        if (item.stock_disponible <= 5) { 
          criticos.push({ id: doc.id, nombre: item.nombre, stock: item.stock_disponible });
        }
      });
      setAlertasStock(criticos);
    });

    const unsubProveedores = onSnapshot(collection(db, "gastos_proveedores"), (snapshot) => {
      const cProveedores = {};
      snapshot.forEach((doc) => {
        const gasto = doc.data();
        const prov = gasto.proveedor || 'Otros';
        cProveedores[prov] = (cProveedores[prov] || 0) + Number(gasto.monto_pagado || 0);
      });
      setDatosProveedores(Object.keys(cProveedores).map(k => ({ proveedor: k, pagado: cProveedores[k] })));
    });

    return () => { unsubVentas(); unsubInventario(); unsubProveedores(); };
  }, []);

  const porcentajeMeta = Math.min((ventasTotales / META_SEMANAL) * 100, 100).toFixed(1);

  // ==========================================
  // RENDERIZADO VISUAL
  // ==========================================
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', background: '#f4f6f8', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: '20px' }}>
        📈 Inteligencia de Negocios Gerencial
      </h1>

      {/* MENÚ DE NAVEGACIÓN (PESTAÑAS) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setPestañaActiva(1)} 
          style={{ padding: '12px 25px', background: pestañaActiva === 1 ? '#0277bd' : '#e0e0e0', color: pestañaActiva === 1 ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.3s' }}>
          💰 1. Rendimiento Financiero
        </button>
        <button 
          onClick={() => setPestañaActiva(2)} 
          style={{ padding: '12px 25px', background: pestañaActiva === 2 ? '#d84315' : '#e0e0e0', color: pestañaActiva === 2 ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.3s' }}>
          🌮 2. Análisis de Menú
        </button>
        <button 
          onClick={() => setPestañaActiva(3)} 
          style={{ padding: '12px 25px', background: pestañaActiva === 3 ? '#00695c' : '#e0e0e0', color: pestañaActiva === 3 ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.3s' }}>
          📦 3. Inventario y Gastos
        </button>
        <button 
          onClick={() => setPestañaActiva(4)} 
          style={{ padding: '12px 25px', background: pestañaActiva === 4 ? '#4527a0' : '#e0e0e0', color: pestañaActiva === 4 ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.3s' }}>
          ⭐ 4. Eficiencia Operativa
        </button>
      </div>

      {/* CONTENIDO DE LA PESTAÑA 1 */}
      {pestañaActiva === 1 && (
        <div className="tab-content" style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ color: '#0277bd', borderBottom: '2px solid #0277bd', paddingBottom: '10px' }}>Rendimiento Financiero</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <h3>Termómetro de Ventas</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2e7d32', margin: '15px 0' }}>${ventasTotales.toFixed(2)}</p>
              <p style={{ color: '#666' }}>Meta Semanal: ${META_SEMANAL}</p>
              <div style={{ width: '100%', background: '#e0e0e0', borderRadius: '10px', height: '25px', marginTop: '15px' }}>
                <div style={{ width: `${porcentajeMeta}%`, background: porcentajeMeta > 80 ? '#4caf50' : '#ff9800', height: '100%', borderRadius: '10px', transition: 'width 0.5s' }}></div>
              </div>
              <small>{porcentajeMeta}% completado</small>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center' }}>Métodos de Pago</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={datosMetodoPago} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                    {datosMetodoPago.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center' }}>Tendencia por Hora</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={datosPorHora} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Area type="monotone" dataKey="ventas" stroke="#8884d8" fill="#e1f5fe" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE LA PESTAÑA 2 */}
      {pestañaActiva === 2 && (
        <div className="tab-content" style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ color: '#d84315', borderBottom: '2px solid #d84315', paddingBottom: '10px' }}>Análisis de Menú y Preferencias</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center' }}>Top 5 Platillos Estrellas</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datosTopPlatillos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#ff7300" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Tabla de Rentabilidad</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Producto</th>
                    <th style={{ padding: '10px' }}>Costo</th>
                    <th style={{ padding: '10px' }}>Precio</th>
                    <th style={{ padding: '10px', color: '#2e7d32' }}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {tablaRentabilidad.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{item.nombre}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>${item.costo}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>${item.precio}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#2e7d32' }}>${item.margen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center' }}>Categorías Populares</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={datosCategorias} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" label>
                    {datosCategorias.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[(index + 2) % COLORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} vendidos`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE LA PESTAÑA 3 */}
      {pestañaActiva === 3 && (
        <div className="tab-content" style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ color: '#00695c', borderBottom: '2px solid #00695c', paddingBottom: '10px' }}>Control de Inventario y Gastos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '6px solid #d32f2f' }}>
              <h3 style={{ color: '#d32f2f', margin: '0 0 15px 0' }}>🚨 Alertas de Stock Crítico</h3>
              {alertasStock.length === 0 ? (
                <p style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.2rem' }}>✅ Inventario en niveles óptimos.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {alertasStock.map(item => (
                    <li key={item.id} style={{ background: '#ffebee', padding: '15px', marginBottom: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                      <span>{item.nombre}</span>
                      <strong style={{ color: '#c62828' }}>Quedan: {item.stock}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center' }}>Gasto por Proveedor</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datosProveedores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="proveedor" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="pagado" fill="#00897b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE LA PESTAÑA 4 */}
      {pestañaActiva === 4 && (
        <div className="tab-content" style={{ animation: 'fadeIn 0.5s' }}>
          <h2 style={{ color: '#4527a0', borderBottom: '2px solid #4527a0', paddingBottom: '10px' }}>Eficiencia Operativa y Satisfacción</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', flex: 1 }}>
                <h3>⏱️ Tiempo Promedio Preparación</h3>
                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ffb300', margin: '20px 0' }}>{tiempoPromedio} <span style={{fontSize: '1.2rem'}}>minutos</span></p>
              </div>
              
              <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', flex: 1 }}>
                <h3>⭐ Satisfacción del Cliente</h3>
                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1565c0', margin: '20px 0' }}>{satisfaccionPromedio} / 5.0</p>
                <div style={{ width: '100%', background: '#e0e0e0', borderRadius: '10px', height: '20px' }}>
                  <div style={{ width: `${(satisfaccionPromedio / 5) * 100}%`, background: '#1976d2', height: '100%', borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ textAlign: 'center' }}>Mapa de Afluencia de Pedidos (Día vs Hora)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" type="number" name="Hora" unit="h" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} />
                  <YAxis dataKey="dia" type="category" name="Día" />
                  <ZAxis dataKey="pedidos" type="number" range={[100, 600]} name="Pedidos" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Afluencia" data={mapaCalor} fill="#5e35b1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

      {/* ESTILOS GLOBALES ANIMACIONES */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}