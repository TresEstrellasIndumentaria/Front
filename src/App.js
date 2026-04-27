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
import ListaOrdenesDeCompraProveedores from './Pages/ListaOrdenesDeCompraProveedores';
import PopupCategoria from './Components/FormCategoria';
import AjusteDeStock from './Pages/AjusteDeStock';
import ListaProveedores from './Pages/ListaProveedores';
import HistorialDeInventario from './Pages/HistorialDeInventario';
import ValoracionDeInventario from './Pages/ValoracionDeInventario';
import ListaVentas from './Pages/ListaVentas';
import Ventas from './Pages/Ventas';
import './App.css';
import FormArticuloProveedoraa from './Components/FormArticuloProveedor';
import CuentaCorrienteCliente from './Pages/CuentaCorrienteCliente';
import CuentaCorrienteProveedor from './Pages/CuentaCorrienteProveedor';
import CobrosPage from './Pages/Cobros';
import ListaCobros from './Pages/ListaCobros';
import ResumenDeVentas from './Pages/ResumenDeVentas';
import VentasPorArticulo from './Pages/VentasPorArticulo';
import VentasPorCategorias from './Pages/VentasPorCategorias';


function App() {
  return (
    <AppProvider>
      <div className="App">
        <Routes>
          {/* RUTAS PUBLICAS */}
          <Route path="/login" element={<LoginPage />} />

          {/* RUTAS PRIVADAS (logueado) */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<DashboardLayout />}>

              {/* Home */}
              <Route index element={<Home />} />

              {/*DATOS PERSONALES (cualquier usuario logueado) */}
              <Route path="mis-datos" element={<ModifDatosPersonales />}/>

              {/*SOLO ADMIN */}
              <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>

                <Route path="creaPersona" element={<Registrarse />} />

                <Route path="listaAdmins" element={<ListaUsuariosPorRol rol="ADMIN" />}/>

                <Route path="listaEmpleados" element={<ListaUsuariosPorRol rol="EMPLEADO" />}/>

                {/* Clientes */}
                <Route path="listaClientes" element={<ListaUsuariosPorRol rol="CLIENTE" />}/>
                <Route path='cliente/:id/cuentaCorrient' element={<CuentaCorrienteCliente/>}/>

                <Route path="modificaUsuario/:rol/:id" element={<ModifUsuario />}/>
                {/* Categorías */}
                <Route path="listaCategorias" element={<ListaCategorias />} />
                <Route path="modificaCategoria/:id" element={<PopupCategoria/>} />
                {/* articulos */}
                <Route path="listaArticulos" element={<ListaArticulos />} />
                <Route path="creaArticulo" element={<FormArticulo />} />
                <Route path="modificaArt/:id" element={<ModifArticulo />} />
                <Route path="ordenesDeCompras" element={<ListaOrdenesDeCompraProveedores />} />
                <Route path="ordenesDeCompras/nueva" element={<OrdenCompra />} />
                <Route path="ordenesDeCompras/:id" element={<OrdenCompra />} />
                <Route path="ajusteDeStock" element={<AjusteDeStock />} />
                <Route path="historialDeInventario" element={<HistorialDeInventario/>} />
                <Route path="historialInventario" element={<HistorialDeInventario/>} />
                <Route path='valoracionDeInventario' element={<ValoracionDeInventario/>} />
                {/* Proveedores */}
                <Route path='listaProveedores' element={<ListaProveedores/>} />
                <Route path='proveedor/:id/cuentaCorrient' element={<CuentaCorrienteProveedor/>} />
                <Route path='creaArticuloProveedor' element={<FormArticuloProveedoraa/>} />
                {/* Ventas */}
                <Route path='listaVentas' element={<ListaVentas/>} />
                <Route path='ventas/nueva' element={<Ventas/>} />
                <Route path='ventas/editar/:id' element={<Ventas/>} />
                <Route path='cobros' element={<CobrosPage/>} />
                <Route path='cobros/editar/:id' element={<CobrosPage/>} />
                <Route path='listaCobros' element={<ListaCobros/>} />
                {/* Informes */}
                <Route path='resumenVentas' element={<ResumenDeVentas/>} />
                <Route path='ventasPorArticulo' element={<VentasPorArticulo/>} />
                <Route path='ventasPorCategorias' element={<VentasPorCategorias/>} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
