import React, { useState } from 'react';
import { userData } from '../../LocalStorage';
import { Link } from 'react-router-dom';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import HailIcon from '@mui/icons-material/Hail';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import './estilos.css';

const BarraLateral = ({ isOpen }) => {
  const userLog = userData();
  const nombre = userLog?.user?.nombre;

  // Estados para desplegar cada menú
  const [usuarioOpen, setUsuarioOpen] = useState(false);
  const [informesOpen, setInformesOpen] = useState(false);
  const [articulosOpen, setArticulosOpen] = useState(false);
  const [empleadosOpen, setEmpleadosOpen] = useState(false);
  const [clientesOpen, setClientesOpen] = useState(false);

  // Función para cerrar todos los menús y abrir solo el deseado
  const handleToggle = (menu) => {
    setUsuarioOpen(menu === 'usuario' ? !usuarioOpen : false);
    setInformesOpen(menu === 'informes' ? !informesOpen : false);
    setArticulosOpen(menu === 'articulos' ? !articulosOpen : false);
    setEmpleadosOpen(menu === 'empleados' ? !empleadosOpen : false);
    setClientesOpen(menu === 'clientes' ? !clientesOpen : false);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="content">

        {/* Usuario */}
        <div className="cont-item-barra" onClick={() => handleToggle('usuario')}>
          <div className="cont-item-icono">
            <AccountBoxIcon sx={{ width: 30, height: 30, color: 'grey' }} />
          </div>
          {isOpen && <div className="cont-item-texto"><p>{nombre}</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation(); // evita que el click suba al cont-item-barra
                  handleToggle('usuario'); // abre/cierra el menú correspondiente
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {usuarioOpen && (
            <ul className="dropdown-menu">
              <Link to="/creaCliente" className="link-menu">
                <li className="dropdown-item">Crear Cliente</li>
              </Link>
              <Link to="/clientes" className="link-menu">
                <li className="dropdown-item">Listar Clientes</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Informes */}
        <div className="cont-item-barra" onClick={() => handleToggle('informes')}>
          <div className="cont-item-icono">
            <BarChartIcon sx={{ width: 30, height: 30, color: 'green' }} />
          </div>
          {isOpen && <div className="cont-item-texto"><p>Informes</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation(); // evita que el click suba al cont-item-barra
                  handleToggle('informes'); // abre/cierra el menú correspondiente
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {informesOpen && (
            <ul className="dropdown-menu">
              <Link to="/ventasDiarias" className="link-menu">
                <li className="dropdown-item">Ventas Diarias</li>
              </Link>
              <Link to="/compras" className="link-menu">
                <li className="dropdown-item">Compras</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Artículos */}
        <div className="cont-item-barra" onClick={() => handleToggle('articulos')}>
          <div className="cont-item-icono">
            <LocalMallIcon sx={{ width: 30, height: 30, color: 'red' }} />
          </div>
          {isOpen && <div className="cont-item-texto"><p>Artículos</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation(); // evita que el click suba al cont-item-barra
                  handleToggle('articulos'); // abre/cierra el menú correspondiente
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {articulosOpen && (
            <ul className="dropdown-menu">
              <Link to="/crearArticulo" className="link-menu">
                <li className="dropdown-item">Crear Artículo</li>
              </Link>
              <Link to="/listaArticulos" className="link-menu">
                <li className="dropdown-item">Listar Artículos</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Empleados */}
        <div className="cont-item-barra" onClick={() => handleToggle('empleados')}>
          <div className="cont-item-icono">
            <ContactEmergencyIcon sx={{ width: 30, height: 30, color: 'green' }} />
          </div>
          {isOpen && <div className="cont-item-texto"><p>Empleados</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation(); // evita que el click suba al cont-item-barra
                  handleToggle('empleados'); // abre/cierra el menú correspondiente
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {empleadosOpen && (
            <ul className="dropdown-menu">
              <Link to="/listaEmpleados" className="link-menu">
                <li className="dropdown-item">Lista de Empleado</li>
              </Link>
              <Link to="/listaEmpleados" className="link-menu">
                <li className="dropdown-item">Derechos de Empleados</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Clientes */}
        <div className="cont-item-barra" onClick={() => handleToggle('clientes')}>
          <div className="cont-item-icono">
            <HailIcon sx={{ width: 30, height: 30, color: 'grey' }} />
          </div>
          {isOpen && <div className="cont-item-texto"><p>Clientes</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation(); // evita que el click suba al cont-item-barra
                  handleToggle('clientes'); // abre/cierra el menú correspondiente
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {clientesOpen && (
            <ul className="dropdown-menu">
              <Link to="/crearCliente" className="link-menu">
                <li className="dropdown-item">Crear Cliente</li>
              </Link>
              <Link to="/listaClientes" className="link-menu">
                <li className="dropdown-item">Listar Clientes</li>
              </Link>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarraLateral;
