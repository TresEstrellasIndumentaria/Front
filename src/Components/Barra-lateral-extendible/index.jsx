import React, { useState, useEffect, useRef } from 'react';
import { userData } from '../../LocalStorage';
import { Link } from 'react-router-dom';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import HailIcon from '@mui/icons-material/Hail';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Tooltip from '@mui/material/Tooltip';

import './estilos.css';


const BarraLateral = ({ isOpen, onClose, menuButtonRef }) => {

  const userLog = userData();
  const nombre = userLog?.user?.nombre;

  // Estados de los menús
  const [usuarioOpen, setUsuarioOpen] = useState(false);
  const [informesOpen, setInformesOpen] = useState(false);
  const [articulosOpen, setArticulosOpen] = useState(false);
  const [adminDeInventarioOpen, setAdminDeInventarioOpen] = useState(false);
  const [adminsOpen, setAdminsOpen] = useState(false);
  const [empleadosOpen, setEmpleadosOpen] = useState(false);
  const [clientesOpen, setClientesOpen] = useState(false);
  const [proveedoresOpen, setProveedoresOpen] = useState(false);
  const [ventasOpen, setVentasOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(null);


  // Referencia a la barra lateral
  const sidebarRef = useRef(null);

  // Función para cerrar todos los menús
  const closeAllMenus = () => {
    setUsuarioOpen(false);
    setInformesOpen(false);
    setArticulosOpen(false);
    setAdminDeInventarioOpen(false);
    setAdminsOpen(false);
    setEmpleadosOpen(false);
    setClientesOpen(false);
    setProveedoresOpen(false);
    setVentasOpen(false);
    setTooltipOpen(null);
  };

  // Función para alternar el menú correspondiente
  const handleToggle = (menu) => {
    setTooltipOpen(null);
    setUsuarioOpen(menu === 'usuario' ? !usuarioOpen : false);
    setInformesOpen(menu === 'informes' ? !informesOpen : false);
    setArticulosOpen(menu === 'articulos' ? !articulosOpen : false);
    setAdminDeInventarioOpen(menu === 'adminDeInventario' ? !adminDeInventarioOpen : false);
    setAdminsOpen(menu === 'administradores' ? !adminsOpen : false);
    setEmpleadosOpen(menu === 'empleados' ? !empleadosOpen : false);
    setClientesOpen(menu === 'clientes' ? !clientesOpen : false);
    setProveedoresOpen(menu === 'proveedores' ? !proveedoresOpen : false);
    setVentasOpen(menu === 'ventas' ? !ventasOpen : false);
  };


  // Detectar clic fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !menuButtonRef?.current?.contains(e.target)
      ) {
        closeAllMenus();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, menuButtonRef]);

  return (
    <div
      ref={sidebarRef}
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="content">
        {/* Usuario */}
        <div className="cont-item-barra" onClick={() => handleToggle('usuario')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <AccountBoxIcon sx={{ width: 25, height: 25, color: 'grey' }} />
            </div>
          ) : (
            <Tooltip
              title="Datos personales"
              placement="right"
              open={!isOpen && tooltipOpen === 'usuario'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('usuario')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <AccountBoxIcon sx={{ width: 25, height: 25, color: 'grey' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>{nombre}</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('usuario');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {usuarioOpen && (
            <ul className="dropdown-menu">
              <Link to="/mis-datos" className="link-menu">
                <li className="dropdown-item">Cuenta</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Informes */}
        <div className="cont-item-barra" onClick={() => handleToggle('informes')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <BarChartIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Informes"
              placement="right"
              open={!isOpen && tooltipOpen === 'informes'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('informes')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <BarChartIcon sx={{ width: 25, height: 25, color: 'green' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>Informes</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('informes');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {informesOpen && (
            <ul className="dropdown-menu">
              <Link to="/resumenVentas" className="link-menu">
                <li className="dropdown-item">Resumen de ventas</li>
              </Link>
              <Link to="/ventasPorArticulo" className="link-menu">
                <li className="dropdown-item">Ventas por artículo</li>
              </Link>
              <Link to="/ventasPorCategoria" className="link-menu">
                <li className="dropdown-item">Ventas por categoría</li>
              </Link>
              <Link to="/ventasPorTipoPago" className="link-menu">
                <li className="dropdown-item">Ventas por tipo de pago</li>
              </Link>
              <Link to="/recibos" className="link-menu">
                <li className="dropdown-item">Recibos</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Artículos */}
        <div className="cont-item-barra" onClick={() => handleToggle('articulos')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <LocalMallIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Artículos"
              placement="right"
              open={!isOpen && tooltipOpen === 'articulos'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('articulos')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <LocalMallIcon sx={{ width: 25, height: 25, color: 'red' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>Artículos</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('articulos');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {articulosOpen && (
            <ul className="dropdown-menu">
              <Link to="/listaArticulos" className="link-menu">
                <li className="dropdown-item">Listar Artículos</li>
              </Link>
              <Link to="/listaCategorias" className="link-menu">
                <li className="dropdown-item">Categorías</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Administración de Inventario */}
        <div className="cont-item-barra" onClick={() => handleToggle('adminDeInventario')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <InventoryIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Administración de inventario"
              placement="right"
              open={!isOpen && tooltipOpen === 'adminDeInventario'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('adminDeInventario')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <InventoryIcon sx={{ width: 25, height: 25, color: 'green' }} />
              </div>
            </Tooltip>
          )}
          {isOpen && <div className="cont-item-texto"><p>Admin de Inventario</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('adminDeInventario');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {adminDeInventarioOpen && (
            <ul className="dropdown-menu">
              <Link to="/ordenesDeCompras" className="link-menu">
                <li className="dropdown-item">Órdenes de compra</li>
              </Link>
              <Link to="/ajusteDeStock" className="link-menu">
                <li className="dropdown-item">Ajustes de stock</li>
              </Link>
              <Link to="/ListaProveedores" className="link-menu">
                <li className="dropdown-item">Proveedores</li>
              </Link>
              <Link to="/historialInventario" className="link-menu">
                <li className="dropdown-item">Historial de inventario</li>
              </Link>
              <Link to="/valoracionDeInventario" className="link-menu">
                <li className="dropdown-item">Valoración de inventario</li>
              </Link>
            </ul>
          )}
        </div>        

        {/* Administradores */}
        <div className="cont-item-barra" onClick={() => handleToggle('administradores')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <HailIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Administradores"
              placement="right"
              open={!isOpen && tooltipOpen === 'administradores'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('administradores')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <HailIcon sx={{ width: 25, height: 25, color: 'green' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>Administradores</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('administradores');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {adminsOpen && (
            <ul className="dropdown-menu">
              <Link to="/listaAdmins" className="link-menu">
                <li className="dropdown-item">Lista de Administradores</li>
              </Link>
              {/* <Link to="/listaEmpleados" className="link-menu">
                <li className="dropdown-item">Derechos de Empleados</li>
              </Link> */}
            </ul>
          )}
        </div>

        {/* Empleados */}
        <div className="cont-item-barra" onClick={() => handleToggle('empleados')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <ContactEmergencyIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Empleados"
              placement="right"
              open={!isOpen && tooltipOpen === 'empleados'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('empleados')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <ContactEmergencyIcon sx={{ width: 25, height: 25, color: 'green' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>Empleados</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('empleados');
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
          {isOpen ? (
            <div className="cont-item-icono">
              <HailIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Clientes"
              placement="right"
              open={!isOpen && tooltipOpen === 'clientes'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('clientes')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <HailIcon sx={{ width: 25, height: 25, color: 'grey' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>Clientes</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('clientes');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {clientesOpen && (
            <ul className="dropdown-menu">
              <Link to="/listaClientes" className="link-menu">
                <li className="dropdown-item">Listar Clientes</li>
              </Link>
              <Link to="/crearCliente" className="link-menu">
                <li className="dropdown-item">otra opc</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Proveedores */}
        <div className="cont-item-barra" onClick={() => handleToggle('proveedores')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <HailIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Proveedores"
              placement="right"
              open={!isOpen && tooltipOpen === 'proveedores'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('proveedores')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <HailIcon sx={{ width: 25, height: 25, color: 'grey' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>Proveedores</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('proveedores');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {proveedoresOpen && (
            <ul className="dropdown-menu">
              <Link to="/listaProveedores" className="link-menu">
                <li className="dropdown-item">Listar Proveedores</li>
              </Link>
              <Link to="/creaArticuloProveedor" className="link-menu">
                <li className="dropdown-item">Cargar articulo</li>
              </Link>
            </ul>
          )}
        </div>

        {/* Lista Ventas */}
        <div className="cont-item-barra" onClick={() => handleToggle('ventas')}>
          {isOpen ? (
            <div className="cont-item-icono">
              <ReceiptLongIcon sx={{ width: 25, height: 25, color: 'green' }} />
            </div>
          ) : (
            <Tooltip
              title="Ventas"
              placement="right"
              open={!isOpen && tooltipOpen === 'ventas'}
              disableHoverListener
              disableFocusListener
              disableTouchListener
            >
              <div
                className="cont-item-icono"
                onMouseEnter={() => setTooltipOpen('ventas')}
                onMouseLeave={() => setTooltipOpen(null)}
              >
                <ReceiptLongIcon sx={{ width: 25, height: 25, color: 'green' }} />
              </div>
            </Tooltip>

          )}
          {isOpen && <div className="cont-item-texto"><p>Ventas</p></div>}
          {isOpen && (
            <div className="cont-item-btn">
              <button
                className="btn-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle('ventas');
                }}
              >
                <KeyboardArrowDownIcon />
              </button>
            </div>
          )}
          {ventasOpen && (
            <ul className="dropdown-menu">
              <Link to="/listaVentas" className="link-menu">
                <li className="dropdown-item">Listar ventas</li>
              </Link>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarraLateral;
