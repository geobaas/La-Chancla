import React, { useState } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VistaReportesBI() {
  const [dashboardActivo, setDashboardActivo] = useState(1);

  // --- DATOS DE PRUEBA PARA GRÁFICAS ---
  const datosMetodosPago = [
    { name: 'Efectivo', value: 15500 },
    { name: 'Tarjeta', value: 12000 },
    { name: 'Transferencia', value: 3500 },
  ];
  const COLORES_PAGO = ['#0088FE', '#00C49F', '#FFBB28'];

  const datosTendenciaHora = [
    { hora: '13:00', ventas: 1200 },
    { hora: '14:00', ventas: 2800 },
    { hora: '15:00', ventas: 2100 },
    { hora: '19:00', ventas: 3500 },
    { hora: '20:00', ventas: 5800 },
    { hora: '21:00', ventas: 4200 },
    { hora: '22:00', ventas: 1500 },
  ];

  return (
    <div className="bi-container">
      <h3>Reportes de Inteligencia de Negocios (BI)</h3>
      
      {/* PESTAÑAS DE NAVEGACIÓN DE DASHBOARDS */}
      <div className="bi-tabs">
        <button className={dashboardActivo === 1 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(1)}>1. Rendimiento Financiero</button>
        <button className={dashboardActivo === 2 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(2)}>2. Análisis de Menú</button>
        <button className={dashboardActivo === 3 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(3)}>3. Inventario y Costos</button>
        <button className={dashboardActivo === 4 ? 'bi-tab-active' : ''} onClick={() => setDashboardActivo(4)}>4. Eficiencia Operativa</button>
      </div>

      {/* CONTENIDO DASHBOARD 1 */}
      {dashboardActivo === 1 && (
        <div className="dashboard-content">
          <h4 className="dash-title">Rendimiento Financiero y Ventas</h4>
          
          <div className="charts-grid">
            <div className="chart-card">
              <h5>Métodos de Pago</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={datosMetodosPago} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {datosMetodosPago.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORES_PAGO[index % COLORES_PAGO.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value} MXN`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card chart-span-2">
              <h5>Tendencia de Ventas por Hora</h5>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={datosTendenciaHora} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="hora" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => `$${value} MXN`} />
                  <Line type="monotone" dataKey="ventas" stroke="#d84315" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DASHBOARD 2 */}
      {dashboardActivo === 2 && (
        <div className="dashboard-content placeholder-dash">
          <span className="icon">🌮</span>
          <h4>Análisis de Menú y Preferencias</h4>
          <p>Módulo de Ingeniería del Menú en construcción (Top 5 Platillos, Rentabilidad).</p>
        </div>
      )}

      {/* CONTENIDO DASHBOARD 3 */}
      {dashboardActivo === 3 && (
        <div className="dashboard-content placeholder-dash">
          <span className="icon">📦</span>
          <h4>Control de Inventario y Costos</h4>
          <p>Conectando alertas de stock crítico y variación de costos de materia prima.</p>
        </div>
      )}

      {/* CONTENIDO DASHBOARD 4 */}
      {dashboardActivo === 4 && (
        <div className="dashboard-content placeholder-dash">
          <span className="icon">⏱️</span>
          <h4>Eficiencia Operativa y Satisfacción</h4>
          <p>Métricas de tiempo de preparación y evaluaciones de servicio al cliente.</p>
        </div>
      )}
    </div>
  );
}