import { Routes, Route } from 'react-router-dom';
import AppProvider from './Context';
import DashboardLayout from './Components/DashboardLayout';
import Home from './Pages/Home';
import LoginPage from './Pages/Login';
import RegistrarsePage from './Pages/Registrarse';
import ModifUsuario from './Pages/ModifUsuario';
import ListaUsuariosPorRol from './Pages/ListaUsuariosPorRol';
import './App.css';
import ListaArticulos from './Pages/ListaArticulos';

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
            {/* Rutas Admins */}
            <Route path="listaAdmins" element={<ListaUsuariosPorRol rol={"administrador"} />} />
            <Route path="creaAdmin" element={<RegistrarsePage rol='administrador' operacion='crear'/>} />
            <Route path='modificaUsuario/:rol/:id' element={<ModifUsuario />} />
            {/* Rutas Emp */}
            <Route path="listaEmpleados" element={<ListaUsuariosPorRol rol={"empleado"} />} />
            <Route path="creaEmpleado" element={<RegistrarsePage rol='empleado' operacion='crear'/>} />
            <Route path='modificaUsuario/:rol/:id' element={<ModifUsuario />} />
            {/* Rutas Cliente */}
            <Route path="listaClientes" element={<ListaUsuariosPorRol rol={"cliente"} />} />
            <Route path="creaCliente" element={<RegistrarsePage rol='cliente' operacion='crear'/>} />
            <Route path='modificaUsuario/:rol/:id' element={<ModifUsuario />} />
            {/* Rutas Provee */}
            <Route path="listaProveedores" element={<ListaUsuariosPorRol rol={"proveedor"} />} />
            <Route path="creaProveedor" element={<RegistrarsePage rol='proveedor' operacion='crear'/>} />
            <Route path='modificaUsuario/:rol/:id' element={<ModifUsuario />} />
            {/* Rutas Articulos */}
            <Route path='listaArticulos' element={<ListaArticulos/>} />
            
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
