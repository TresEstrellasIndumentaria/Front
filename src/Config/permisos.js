export const PERMISOS = {
  CLIENTES: 'CLIENTES',
  PROVEEDORES: 'PROVEEDORES',
  COMPRAS: 'COMPRAS',
  ARTICULOS: 'ARTICULOS',
  INVENTARIO_AJUSTE: 'INVENTARIO_AJUSTE',
  INVENTARIO_HISTORIAL: 'INVENTARIO_HISTORIAL',
  INVENTARIO_VALORACION: 'INVENTARIO_VALORACION',
  VENTAS: 'VENTAS',
  COBROS: 'COBROS',
  INFORMES: 'INFORMES',
};

export const PERMISOS_EMPLEADO = [
  { key: PERMISOS.CLIENTES, titulo: 'Clientes', descripcion: 'Listar clientes, crear ventas desde cliente y consultar cuentas corrientes.' },
  { key: PERMISOS.PROVEEDORES, titulo: 'Proveedores', descripcion: 'Listar proveedores y consultar cuentas corrientes de proveedores.' },
  { key: PERMISOS.COMPRAS, titulo: 'Compras', descripcion: 'Crear, editar y consultar ordenes de compra.' },
  { key: PERMISOS.ARTICULOS, titulo: 'Articulos y categorias', descripcion: 'Listar, crear y modificar articulos y categorias.' },
  { key: PERMISOS.INVENTARIO_AJUSTE, titulo: 'Ajustes de stock', descripcion: 'Realizar ajustes manuales de stock.' },
  { key: PERMISOS.INVENTARIO_HISTORIAL, titulo: 'Historial de inventario', descripcion: 'Consultar movimientos historicos de inventario.' },
  { key: PERMISOS.INVENTARIO_VALORACION, titulo: 'Valoracion de inventario', descripcion: 'Consultar valorizacion de stock.' },
  { key: PERMISOS.VENTAS, titulo: 'Ventas', descripcion: 'Crear, editar y listar ventas/remitos.' },
  { key: PERMISOS.COBROS, titulo: 'Cobros', descripcion: 'Registrar y consultar cobros de clientes.' },
  { key: PERMISOS.INFORMES, titulo: 'Informes', descripcion: 'Consultar resumenes y reportes comerciales.' },
];

export const usuarioEsAdmin = (user) => {
  const roles = user?.roles || user?.user?.roles || [];
  return roles.includes('ADMIN');
};

export const usuarioTienePermiso = (user, permiso) => {
  if (!permiso) return true;
  if (usuarioEsAdmin(user)) return true;
  const permisos = user?.permisos || user?.user?.permisos || [];
  return permisos.includes(permiso);
};

export const usuarioTieneAlgunPermiso = (user, permisos = []) => {
  if (!permisos.length) return true;
  if (usuarioEsAdmin(user)) return true;
  return permisos.some((permiso) => usuarioTienePermiso(user, permiso));
};
