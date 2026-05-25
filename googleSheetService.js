const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwvq0G_Znhnx95kh3ejS-s5R1t0u9IoMOlHko6Ay5iQRK8bZTzkaGSLyyBzaSPh7WE1pw/exec";

/**
 * Función universal para enviar datos al Excel
 * @param {string} tabla - Nombre exacto de la pestaña (Ej: 'Pedidos_Cabeceras')
 * @param {string} accion - 'crear', 'actualizar' o 'eliminar'
 * @param {object} datos - El objeto con la información
 * @param {string|number} id - (Opcional) El ID si se va a eliminar o actualizar
 */
export const enviarAlExcel = async (tabla, accion, datos, id = null) => {
  try {
    const cuerpoPeticion = {
      tipo_tabla: tabla,
      accion: accion,
      id_registro: id,
      ...datos // Esto esparce los campos del objeto (nombre, precio, etc)
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Crucial para evitar errores de seguridad
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpoPeticion),
    });

    console.log(`Acción ${accion} enviada a ${tabla} correctamente.`);
  } catch (error) {
    console.error("Error al conectar con Google Sheets:", error);
  }
};