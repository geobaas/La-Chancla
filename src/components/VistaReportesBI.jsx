import React, { useState } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VistaReportesBI() {
  const [dashboardActivo, setDashboardActivo] = useState(1);

  // ==========================================
  // DATOS DE PRUEBA (ESQUEMA FIREBASE)
  // ==========================================
  
  // PALETAS DE COLORES (Estilo La Chancla)
  const COLORES_BASE = ['#d84315', '#fbc02d', '#2e7d32', '#1565c0', '#8e24aa'];
  const COLORES_PAGO = ['#2e7d32', '#1565c0', '#fbc02d']; // Efectivo, Tarjeta, Transferencia

  // --- DASHBOARD 1: FINANZAS ---
  const ventasTotales = 28500;
  const metaVentas = 31000;
  const porcentajeMeta = Math.min((ventasTotales / metaVentas) * 100, 100).toFixed(1);

  const datosPagos = [
    { name: 'Efectivo', value: 14250 },
    { name: 'Tarjeta', value: 9800 },
    { name: 'Transferencia', value: 4450 },
  ];

  const datosHora = [
    { hora: '13:00', ventas: 1200 }, { hora: '14:00', ventas: 2500 }, { hora: '15:00', ventas: 3100 },
    { hora: '18:00', ventas: 1800 }, { hora: '19:00', ventas: 4200 }, { hora: '20:00', ventas: 5900 },
    { hora: '21:00', ventas: 6800 }, { hora: '22:00', ventas: 3000 },
  ];

  // --- DASHBOARD 2: MENÚ ---
  const topPlatillos = [
    { nombre: 'Taco Cochinita', ordenes: 340 },
    { nombre: 'Torta Asada', ordenes: 210 },
    { nombre: 'Combo Godín', ordenes: 180 },
    { nombre: 'Volcán Queso', ordenes: 145 },
    { nombre: 'Orden Guacamole', ordenes: 120 },
  ];

  const categoriasPopulares = [
    { name: 'Platillos', value: 45 }, { name: 'Bebidas', value: 25 }, 
    { name: 'Combos', value: 20 }, { name: 'Complementos', value: 10 }
  ];

  const tablaRentabilidad = [
    { platillo: 'Taco Cochinita', costo: 12.50, venta: 35.00, margen: 64.2 },
    { platillo: 'Agua Horchata', costo: 10.00, venta: 40.00, margen: 75.0 },
    { platillo: 'Combo Godín', costo: 45.00, venta: 120.00, margen: 62.5 },
  ];

  // --- DASHBOARD 3: INVENTARIO ---
  const alertasStock = [
    { insumo: 'Carne de Cerdo (KG)', actual: 4.2, minimo: 12, estado: 'Crítico' },
    { insumo: 'Tortillas Maíz (KG)', actual: 2, minimo: 6, estado: 'Crítico' },
    { insumo: 'Limón (KG)', actual: 1.2, minimo: 4, estado: 'Crítico' },
    { insumo: 'Carne de Res (KG)', actual: 16.5, minimo: 10, estado: 'Óptimo' },
  ];

  const gastoProveedor = [
    { proveedor: 'Carnicería San José', gasto: 12500 },
    { proveedor: 'Frutería El Centro', gasto: 3400 },
    { proveedor: 'Bebidas del Sureste', gasto: 8200 },
    { proveedor: 'Abarrotes Dunosusa', gasto: 4100 },
  ];

  const variacionCostos = [
    { mes: 'Ene', limon: 25, aguacate: 60, carne: 110 },
    { mes: 'Feb', limon: 28, aguacate: 65, carne: 110 },
    { mes: 'Mar', limon: 45, aguacate: 80, carne: 115 }, // Temporada cara
    { mes: 'Abr', limon: 30, aguacate: 70, carne: 115 },
  ];

  // --- DASHBOARD 4: EFICIENCIA ---
  const tiempoPreparacion = 12.4; // Minutos
  const satisfaccionCliente = 4.7; // De 5 estrellas

  // Simulación para Mapa de Calor (Filas: Días, Columnas: Turnos/Horas)
  const mapaCalor = [
    { dia: 'Jueves', t1: 20, t2: 45, t3: 80 },
    { dia: 'Viernes', t1: 30, t2: 60, t3: 100 },
    { dia: 'Sábado', t1: 50, t2: 90, t3: 100 },
    { dia: 'Domingo', t1: 70, t2: 40, t3: 20 },
  ];

  // Función auxiliar para color del mapa de calor
  const getHeatColor = (value) => {
    if (value > 80) return '#d84315'; // Muy concurrido (Rojo)
    if (value > 50) return '#fbc02d'; // Medio (Amarillo)
    if (value > 20) return '#ffe0b2'; // Bajo (Crema)
    return '#f5f5f5'; // Vacío (Gris)
  };

  return (
    <div className="bi-container">
      <h3>Reportes de Inteligencia de Negocios (BI)</h3>
      
      {/* NAVEGACIÓN DASHBOARDS */}
      <div className="bi-tabs">
        <button className={dashboardActivo === 1 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(1)}>1. Rendimiento Financiero</button>
        <button className={dashboardActivo === 2 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(2)}>2. Análisis de Menú</button>
        <button className={dashboardActivo === 3 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(3)}>3. Inventario y Costos</button>
        <button className={dashboardActivo === 4 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(4)}>4. Eficiencia Operativa</button>
      </div>

      {/* ==============================================
          DASHBOARD 1: FINANZAS Y VENTAS
      ============================================== */}
      {dashboardActivo === 1 && (
        <div className="dashboard-content">
          <h4 className="dash-title">Rendimiento Financiero y Ventas</h4>
          
          <div className="charts-grid">
            {/* Termómetro de Ventas */}
            <div className="chart-card chart-span-2">
              <h5>Termómetro de Ventas vs Meta Semanal</h5>
              <div className="thermometer-container">
                <div className="thermometer-labels">
                  <span>Actual: ${ventasTotales.toLocaleString()}</span>
                  <span>Meta: ${metaVentas.toLocaleString()}</span>
                </div>
                <div className="thermometer-track">
                  <div className="thermometer-fill" style={{ width: `${porcentajeMeta}%`, backgroundColor: porcentajeMeta >= 100 ? '#2e7d32' : '#fbc02d' }}></div>
                </div>
                <p className="thermometer-text">¡Se ha alcanzado el <strong>{porcentajeMeta}%</strong> del objetivo!</p>
              </div>
            </div>

            {/* Pastel de Pagos */}
            <div className="chart-card">
              <h5>Métodos de Pago</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={datosPagos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                    {datosPagos.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORES_PAGO[index % COLORES_PAGO.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value} MXN`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tendencia por Hora */}
            <div className="chart-card chart-span-2">
              <h5>Tendencia de Ventas por Hora</h5>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={datosHora} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="hora" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => `$${value} MXN`} />
                  <Line type="monotone" dataKey="ventas" stroke="#d84315" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          DASHBOARD 2: ANÁLISIS DE MENÚ
      ============================================== */}
      {dashboardActivo === 2 && (
        <div className="dashboard-content">
          <h4 className="dash-title">Análisis de Menú y Preferencias</h4>
          <div className="charts-grid">
            
            <div className="chart-card">
              <h5>Top 5 Platillos Más Vendidos</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topPlatillos} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="ordenes" fill="#d84315" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h5>Categorías Populares</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoriasPopulares} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {categoriasPopulares.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORES_BASE[index % COLORES_BASE.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card chart-span-2">
              <h5>Tabla Comparativa de Rentabilidad (Ingeniería de Menú)</h5>
              <table className="crud-table" style={{ marginTop: '10px' }}>
                <thead>
                  <tr><th>Platillo</th><th>Costo Prod.</th><th>Precio Venta</th><th>Margen %</th></tr>
                </thead>
                <tbody>
                  {tablaRentabilidad.map((item, i) => (
                    <tr key={i}>
                      <td>{item.platillo}</td><td>${item.costo.toFixed(2)}</td>
                      <td>${item.venta.toFixed(2)}</td>
                      <td style={{ color: item.margen > 70 ? '#2e7d32' : '#d84315', fontWeight: 'bold' }}>{item.margen}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          DASHBOARD 3: INVENTARIO Y COSTOS
      ============================================== */}
      {dashboardActivo === 3 && (
        <div className="dashboard-content">
          <h4 className="dash-title">Control de Inventario y Costos</h4>
          <div className="charts-grid">
            
            <div className="chart-card">
              <h5>Alertas de Stock Crítico</h5>
              <div className="alert-list">
                {alertasStock.map((item, i) => (
                  <div key={i} className={`alert-item ${item.estado === 'Crítico' ? 'alert-red' : 'alert-green'}`}>
                    <span className="alert-name">{item.insumo}</span>
                    <span className="alert-numbers">Disp: <strong>{item.actual}</strong> / Min: {item.minimo}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h5>Gasto por Proveedor</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gastoProveedor} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="proveedor" tick={false} /> {/* Ocultamos texto largo del eje X */}
                  <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Bar dataKey="gasto" fill="#fbc02d" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card chart-span-2">
              <h5>Variación de Costos de Materia Prima</h5>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={variacionCostos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}/kg`} />
                  <Legend />
                  <Line type="monotone" dataKey="limon" name="Limón" stroke="#2e7d32" strokeWidth={2} />
                  <Line type="monotone" dataKey="aguacate" name="Aguacate" stroke="#8e24aa" strokeWidth={2} />
                  <Line type="monotone" dataKey="carne" name="Carne Cerdo" stroke="#d84315" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================
          DASHBOARD 4: EFICIENCIA OPERATIVA
      ============================================== */}
      {dashboardActivo === 4 && (
        <div className="dashboard-content">
          <h4 className="dash-title">Eficiencia Operativa y Satisfacción</h4>
          <div className="charts-grid">
            
            {/* KPIs Rápidos */}
            <div className="chart-card kpi-card">
              <h5>Tiempo Promedio de Preparación</h5>
              <div className="kpi-value">{tiempoPreparacion} <span className="kpi-unit">minutos</span></div>
              <p>Desde la toma de orden hasta el despacho.</p>
            </div>

            <div className="chart-card kpi-card">
              <h5>Termómetro de Satisfacción</h5>
              <div className="kpi-value" style={{ color: '#fbc02d' }}>{satisfaccionCliente} <span className="kpi-unit">⭐ / 5</span></div>
              <p>Promedio de evaluaciones de clientes.</p>
            </div>

            {/* Mapa de Calor */}
            <div className="chart-card chart-span-2">
              <h5>Mapa de Calor: Afluencia de Pedidos</h5>
              <table className="heatmap-table">
                <thead>
                  <tr><th>Día / Turno</th><th>Comida (1pm-4pm)</th><th>Tarde (5pm-8pm)</th><th>Cena (9pm-12am)</th></tr>
                </thead>
                <tbody>
                  {mapaCalor.map((row, i) => (
                    <tr key={i}>
                      <td className="heat-day">{row.dia}</td>
                      <td style={{ backgroundColor: getHeatColor(row.t1), color: row.t1 > 50 ? 'white' : 'black' }}>{row.t1} pedidos</td>
                      <td style={{ backgroundColor: getHeatColor(row.t2), color: row.t2 > 50 ? 'white' : 'black' }}>{row.t2} pedidos</td>
                      <td style={{ backgroundColor: getHeatColor(row.t3), color: row.t3 > 50 ? 'white' : 'black' }}>{row.t3} pedidos</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}