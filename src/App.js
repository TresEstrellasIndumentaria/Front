import { Routes, Route } from 'react-router-dom';
import AppProvider from './Context';
import DashboardLayout from './Components/DashboardLayout';
import Home from './Pages/Home';
import LoginPage from './Pages/Login';
import RegistrarsePage from './Pages/Registrarse';
import './App.css';
import ListaEmpleados from './Pages/ListaEmpleados';

function App() {
  return (
    <AppProvider>
      <div className="App">
        <Routes>
          {/* rutas publicas */}
          <Route path='/login' element={<LoginPage />} />
          <Route path='/registrarse' element={<RegistrarsePage />} />

          {/* Dashboard con navbar + sidebar fijos */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="listaEmpleados" element={<ListaEmpleados />} />
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
