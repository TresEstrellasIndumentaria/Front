import { Routes, Route } from 'react-router-dom';
import AppProvider from './Context';
import DashboardLayout from './Components/DashboardLayout';
import Home from './Pages/Home';
import LoginPage from './Pages/Login';
import ModifUsuario from './Pages/ModifUsuario';
import ListaUsuariosPorRol from './Pages/ListaUsuariosPorRol';
import ListaArticulos from './Pages/ListaArticulos';
import FormArticulo from './Components/FormArticulo';
import ModifArticulo from './Pages/ModifArticulo';
import ListaCategorias from './Pages/ListaCategorias';
import PrivateRoute from './Routes/PrivateRoute';
import OrdenCompra from './Components/OrdenDeCompra';
import Registrarse from './Components/Registrarse';
import ModifDatosPersonales from './Pages/ModifDatosPersonales';
import PopupCategoria from './Components/FormCategoria';
import AjusteDeStock from './Pages/AjusteDeStock';
import ListaProveedores from './Pages/ListaProveedores';
import HistorialDeInventario from './Pages/HistorialDeInventario';
import ValoracionDeInventario from './Pages/ValoracionDeInventario';
import ListaVentas from './Pages/ListaVentas';
import Ventas from './Pages/Ventas';
import CuentaCorrienteCliente from './Pages/CuentaCorrienteCliente';
import CuentaCorrienteProveedor from './Pages/CuentaCorrienteProveedor';
import CobrosPage from './Pages/Cobros';
import ListaCobros from './Pages/ListaCobros';
import ResumenDeVentas from './Pages/ResumenDeVentas';
import ResumenDeCompras from './Pages/ResumenDeCompras';
import VentasPorArticulo from './Pages/VentasPorArticulo';
import VentasPorCategorias from './Pages/VentasPorCategorias';
import PermisosEmpleados from './Pages/PermisosEmpleados';
import { PERMISOS } from './Config/permisos';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="mis-datos" element={<ModifDatosPersonales />} />

              <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                <Route path="creaPersona" element={<Registrarse />} />
                <Route path="listaAdmins" element={<ListaUsuariosPorRol rol="ADMIN" />} />
                <Route path="listaEmpleados" element={<ListaUsuariosPorRol rol="EMPLEADO" />} />
                <Route path="permisosEmpleados" element={<PermisosEmpleados />} />
                <Route path="modificaUsuario/:rol/:id" element={<ModifUsuario />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.CLIENTES]} />}>
                <Route path="listaClientes" element={<ListaUsuariosPorRol rol="CLIENTE" />} />
                <Route path="cliente/:id/cuentaCorrient" element={<CuentaCorrienteCliente />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.ARTICULOS]} />}>
                <Route path="listaCategorias" element={<ListaCategorias />} />
                <Route path="modificaCategoria/:id" element={<PopupCategoria />} />
                <Route path="listaArticulos" element={<ListaArticulos />} />
                <Route path="creaArticulo" element={<FormArticulo />} />
                <Route path="modificaArt/:id" element={<ModifArticulo />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.INVENTARIO_AJUSTE]} />}>
                <Route path="ajusteDeStock" element={<AjusteDeStock />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.INVENTARIO_HISTORIAL]} />}>
                <Route path="historialDeInventario" element={<HistorialDeInventario />} />
                <Route path="historialInventario" element={<HistorialDeInventario />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.INVENTARIO_VALORACION]} />}>
                <Route path="valoracionDeInventario" element={<ValoracionDeInventario />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.PROVEEDORES]} />}>
                <Route path="listaProveedores" element={<ListaProveedores />} />
                <Route path="proveedor/:id/cuentaCorrient" element={<CuentaCorrienteProveedor />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.COMPRAS]} />}>
                <Route path="ordenesDeCompras/nueva" element={<OrdenCompra />} />
                <Route path="ordenesDeCompras/:id" element={<OrdenCompra />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.VENTAS]} />}>
                <Route path="listaVentas" element={<ListaVentas />} />
                <Route path="ventas/nueva" element={<Ventas />} />
                <Route path="ventas/editar/:id" element={<Ventas />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.COBROS]} />}>
                <Route path="cobros" element={<CobrosPage />} />
                <Route path="cobros/editar/:id" element={<CobrosPage />} />
                <Route path="listaCobros" element={<ListaCobros />} />
              </Route>

              <Route element={<PrivateRoute allowedPermissions={[PERMISOS.INFORMES]} />}>
                <Route path="resumenVentas" element={<ResumenDeVentas />} />
                <Route path="resumenCompras" element={<ResumenDeCompras />} />
                <Route path="ventasPorArticulo" element={<VentasPorArticulo />} />
                <Route path="ventasPorCategorias" element={<VentasPorCategorias />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
