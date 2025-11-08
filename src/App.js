import { Routes, Route } from 'react-router-dom';
import AppProvider from './Context';
import DashboardLayout from './Components/DashboardLayout';
import Home from './Pages/Home';
import LoginPage from './Pages/Login';
import RegistrarsePage from './Pages/Registrarse';
import ListaEmpleados from './Pages/ListaEmpleados';
import ListaClientes from './Pages/ListaClientes';
import './App.css';
import ModifUsuario from './Pages/ModifUsuario';

function App() {
  return (
    <AppProvider>
      <div className="App">
        <Routes>
          {/* rutas publicas */}
          <Route path='/login' element={<LoginPage />} />
          <Route path='/registrarse' element={<RegistrarsePage />} /> {/* puede que no se necesite SOLO el Admin va a crear usuarios */}

          {/* Dashboard con navbar + sidebar fijos */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="listaEmpleados" element={<ListaEmpleados />} />
            <Route path="creaEmpleado" element={<RegistrarsePage rol='usuario' operacion='crear'/>} />
            <Route path='modificaUsuario/:id' element={<ModifUsuario rol='usuario' operacion='modificar'/>} />
            <Route path="listaClientes" element={<ListaClientes />} />
            <Route path="creaCliente" element={<RegistrarsePage rol='cliente' operacion='crear'/>} />
            <Route path='modificaCliente/:id' element={<ModifUsuario rol='cliente' operacion='modificar'/>} />
            {/*<Route path="informes" element={<Informes />} />
            <Route path="articulos" element={<Articulos />} /> */}
          </Route>
        </Routes>


        <footer>

        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
