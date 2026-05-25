import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import './assets/App.css'; // Esto conecta el diseño

// Aquí importamos tus archivos de la carpeta components
import VistaCliente from './components/VistaCliente';
import VistaMostrador from './components/VistaMostrador';
import VistaGerencia from './components/VistaGerencia';

function App() {
  const [platillos, setPlatillos] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [rolActual, setRolActual] = useState('cliente'); 
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [tipoLogin, setTipoLogin] = useState('cliente');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameEmpleado, setUsernameEmpleado] = useState('');

  // Cargar datos de Firebase
  useEffect(() => {
    const q = collection(db, "menu");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach((docItem) => docs.push({ ...docItem.data(), id: docItem.id }));
      setPlatillos(docs);
    });
    return () => unsubscribe();
  }, []);

  // Manejar sesión
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUsuarioActual(user);
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRolActual(docSnap.data().rol); 
        } else {
          await setDoc(docRef, { email: user.email, rol: 'cliente' });
          setRolActual('cliente');
        }
      } else {
        setRolActual('cliente'); 
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (tipoLogin === 'cliente') {
        if (isRegistering) {
          await createUserWithEmailAndPassword(auth, email, password);
          alert("Cuenta creada exitosamente.");
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } else {
        const correoInterno = `${usernameEmpleado.toLowerCase().trim()}@lachancla.interno`;
        await signInWithEmailAndPassword(auth, correoInterno, password);
      }
      setMostrarLogin(false);
      setEmail(''); setPassword(''); setUsernameEmpleado('');
    } catch (error) {
      alert("Error: Verifica tus credenciales.");
    }
  };

  const handleRecuperarPassword = async () => {
    if (!email) {
      alert("Por favor escribe tu correo arriba para enviarte el enlace.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Enlace enviado a tu correo.");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const cerrarSesion = async () => await signOut(auth);

  return (
    <div className="app-container">
      {/* BARRA SUPERIOR */}
      <div className="auth-top-bar">
        {usuarioActual ? (
          <div className="user-info">
            <span>👤 Conectado como: <strong>{usuarioActual.email.replace('@lachancla.interno', '')}</strong> ({rolActual.toUpperCase()})</span>
            <button className="btn-logout" onClick={cerrarSesion}>Cerrar Sesión</button>
          </div>
        ) : (
          <button className="btn-login-trigger" onClick={() => setMostrarLogin(true)}>👤 Iniciar Sesión</button>
        )}
      </div>

      {/* MODAL DE LOGIN */}
      {mostrarLogin && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <div className="login-tabs">
              <button className={tipoLogin === 'cliente' ? 'tab-active' : ''} onClick={() => {setTipoLogin('cliente'); setIsRegistering(false);}}>Soy Cliente</button>
              <button className={tipoLogin === 'empleado' ? 'tab-active' : ''} onClick={() => {setTipoLogin('empleado'); setIsRegistering(false);}}>Personal</button>
            </div>
            <form onSubmit={handleAuth} className="login-form">
              {tipoLogin === 'cliente' ? (
                <>
                  <h3>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h3>
                  <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
                  <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                  {!isRegistering && <p className="forgot-password" onClick={handleRecuperarPassword}>¿Olvidaste tu contraseña?</p>}
                  <button type="submit" className="btn-submit-login">{isRegistering ? 'Registrarme' : 'Entrar'}</button>
                  <p className="toggle-login" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? '¿Ya tienes cuenta? Entra aquí.' : '¿Nuevo? Regístrate.'}
                  </p>
                </>
              ) : (
                <>
                  <h3>Portal Empleados</h3>
                  <input type="text" placeholder="Usuario" value={usernameEmpleado} onChange={e => setUsernameEmpleado(e.target.value)} required />
                  <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="submit" className="btn-submit-login employee-btn">Acceder</button>
                </>
              )}
            </form>
            <button className="btn-close-modal" onClick={() => setMostrarLogin(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* RENDERIZADO DE LOS COMPONENTES */}
      {rolActual === 'cliente' && <VistaCliente platillos={platillos} />}
      {rolActual === 'mostrador' && <VistaMostrador platillos={platillos} />}
      {rolActual === 'gerencia' && <VistaGerencia platillos={platillos} />}
    </div>
  );
}

export default App;