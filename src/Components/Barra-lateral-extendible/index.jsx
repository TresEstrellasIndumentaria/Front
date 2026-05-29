import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import GroupsIcon from '@mui/icons-material/Groups';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { userData } from '../../LocalStorage';
import { PERMISOS, usuarioTieneAlgunPermiso } from '../../Config/permisos';
import './estilos.css';

const MENU_ITEMS = [
  {
    key: 'inicio',
    label: 'Inicio',
    Icon: HomeIcon,
    directTo: '/',
  },
  {
    key: 'usuario',
    label: 'Datos personales',
    openLabel: 'Cuenta',
    Icon: AccountBoxIcon,
    links: [{ to: '/mis-datos', label: 'Cuenta' }],
  },
  {
    key: 'proveedores',
    label: 'Proveedores',
    Icon: LocalShippingIcon,
    links: [
      { to: '/listaProveedores', label: 'Listar Proveedores', permisos: [PERMISOS.PROVEEDORES] },
      { to: '/ordenesDeCompras/nueva', label: 'Orden de compra', permisos: [PERMISOS.COMPRAS] },
      { to: '/resumenCompras', label: 'Resumen de compras', permisos: [PERMISOS.INFORMES] },
    ],
  },
  {
    key: 'articulos',
    label: 'Articulos',
    Icon: LocalMallIcon,
    links: [
      { to: '/listaArticulos', label: 'Listar Articulos', permisos: [PERMISOS.ARTICULOS] },
      { to: '/listaCategorias', label: 'Categorias', permisos: [PERMISOS.ARTICULOS] },
    ],
  },
  {
    key: 'adminDeInventario',
    label: 'Administracion de inventario',
    openLabel: 'Admin de Inventario',
    Icon: InventoryIcon,
    links: [
      { to: '/ajusteDeStock', label: 'Ajustes de stock', permisos: [PERMISOS.INVENTARIO_AJUSTE] },
      { to: '/historialInventario', label: 'Historial de inventario', permisos: [PERMISOS.INVENTARIO_HISTORIAL] },
      { to: '/valoracionDeInventario', label: 'Valoracion de inventario', permisos: [PERMISOS.INVENTARIO_VALORACION] },
    ],
  },
  {
    key: 'clientes',
    label: 'Clientes',
    Icon: GroupsIcon,
    links: [
      { to: '/listaClientes', label: 'Listar Clientes', permisos: [PERMISOS.CLIENTES] },
    ],
  },
  {
    key: 'venta',
    label: '$$ Venta',
    Icon: AttachMoneyIcon,
    directTo: '/ventas/nueva',
    permisos: [PERMISOS.VENTAS],
  },
  {
    key: 'informes',
    label: 'Informes',
    Icon: BarChartIcon,
    links: [
      { to: '/resumenVentas', label: 'Resumen de ventas', permisos: [PERMISOS.INFORMES] },
      { to: '/ventasPorArticulo', label: 'Ventas por articulo', permisos: [PERMISOS.INFORMES] },
      { to: '/ventasPorCategorias', label: 'Ventas por categoria', permisos: [PERMISOS.INFORMES] },
    ],
  },
  {
    key: 'administradores',
    label: 'Administradores',
    Icon: AdminPanelSettingsIcon,
    links: [{ to: '/listaAdmins', label: 'Lista de Administradores', adminOnly: true }],
  },
  {
    key: 'empleados',
    label: 'Empleados',
    Icon: ContactEmergencyIcon,
    links: [
      { to: '/listaEmpleados', label: 'Lista de Empleado', adminOnly: true },
      { to: '/permisosEmpleados', label: 'Permisos para empleados', adminOnly: true },
    ],
  },
];

const BarraLateral = ({ isOpen, onClose, menuButtonRef }) => {
  const userLog = userData();
  const nombre = userLog?.user?.nombre;
  const sidebarRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [tooltipOpen, setTooltipOpen] = useState(null);

  const closeAllMenus = () => {
    setOpenMenu(null);
    setTooltipOpen(null);
  };

  const handleToggle = (menu) => {
    setTooltipOpen(null);
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

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

  const renderMenuItem = ({ key, label, openLabel, Icon, links }) => {
    const icon = <Icon sx={{ width: 25, height: 25 }} />;

    if (!links) return null;

    const linksVisibles = links.filter((link) => {
      if (link.adminOnly) return userLog?.roles?.includes('ADMIN');
      return usuarioTieneAlgunPermiso(userLog, link.permisos || []);
    });
    if (!linksVisibles.length) return null;

    const visibleLabel = key === 'usuario' ? nombre || openLabel || label : openLabel || label;

    return (
      <div className="cont-item-barra" onClick={() => handleToggle(key)} key={key}>
        {isOpen ? (
          <div className="cont-item-icono">{icon}</div>
        ) : (
          <Tooltip
            title={label}
            placement="right"
            open={!isOpen && tooltipOpen === key}
            disableHoverListener
            disableFocusListener
            disableTouchListener
          >
            <div
              className="cont-item-icono"
              onMouseEnter={() => setTooltipOpen(key)}
              onMouseLeave={() => setTooltipOpen(null)}
            >
              {icon}
            </div>
          </Tooltip>
        )}

        {isOpen && <div className="cont-item-texto"><p>{visibleLabel}</p></div>}
        {isOpen && (
          <div className="cont-item-btn">
            <button
              className="btn-down"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(key);
              }}
            >
              <KeyboardArrowDownIcon />
            </button>
          </div>
        )}

        {openMenu === key && (
          <ul className="dropdown-menu">
            {linksVisibles.map((link) => (
              <Link to={link.to} className="link-menu" key={`${key}-${link.to}-${link.label}`}>
                <li className="dropdown-item">{link.label}</li>
              </Link>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderDirectItem = ({ key, label, Icon, directTo, permisos }) => {
    if (!usuarioTieneAlgunPermiso(userLog, permisos || [])) return null;

    const icon = <Icon sx={{ width: 25, height: 25 }} />;

    return (
      <Link
        to={directTo}
        className="cont-item-barra cont-item-barra-link"
        onClick={closeAllMenus}
        key={key}
      >
        {isOpen ? (
          <div className="cont-item-icono">{icon}</div>
        ) : (
          <Tooltip
            title={label}
            placement="right"
            open={!isOpen && tooltipOpen === key}
            disableHoverListener
            disableFocusListener
            disableTouchListener
          >
            <div
              className="cont-item-icono"
              onMouseEnter={() => setTooltipOpen(key)}
              onMouseLeave={() => setTooltipOpen(null)}
            >
              {icon}
            </div>
          </Tooltip>
        )}

        {isOpen && <div className="cont-item-texto"><p>{label}</p></div>}
      </Link>
    );
  };

  return (
    <div
      ref={sidebarRef}
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="content">
        {MENU_ITEMS.map((item) => (item.directTo ? renderDirectItem(item) : renderMenuItem(item)))}
      </div>
    </div>
  );
};

export default BarraLateral;
