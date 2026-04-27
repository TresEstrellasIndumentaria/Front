import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CuentaCorriente from '../../Components/CuentaCorriente';
import { getUsuarioById, getUsuarioByRol } from '../../Redux/Actions';
import './styles.css';

const getNombreProveedor = (proveedor) => {
  if (!proveedor) return 'Proveedor no encontrado';
  const nombre = `${proveedor.nombre || ''} ${proveedor.apellido || ''}`.trim();
  return nombre || proveedor.razonSocial || proveedor.nombreFantasia || 'Sin nombre';
};

function CuentaCorrienteProveedor() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { id } = useParams();
  const proveedores = useSelector((state) => state.usuariosRol || []);
  const dataUsuario = useSelector((state) => state.dataUsuario || {});
  const [proveedorDesdeRuta, setProveedorDesdeRuta] = useState(location.state?.proveedor || null);

  useEffect(() => {
    if (location.state?.proveedor) {
      setProveedorDesdeRuta(location.state.proveedor);
      return;
    }

    if (!proveedores.length) {
      dispatch(getUsuarioByRol('PROVEEDOR'));
    }

    if (id) {
      dispatch(getUsuarioById(id)).then((data) => {
        if (data?._id === id) {
          setProveedorDesdeRuta(data);
        }
      });
    }
  }, [dispatch, id, location.state, proveedores.length]);

  const proveedor = useMemo(() => {
    if (proveedorDesdeRuta) return proveedorDesdeRuta;
    if (dataUsuario?._id === id) return dataUsuario;
    return proveedores.find((item) => item?._id === id) || null;
  }, [dataUsuario, id, proveedorDesdeRuta, proveedores]);

  return (
    <section className="cuenta-corriente-page">
      <div className="cuenta-corriente-page-shell">
        <header className="cuenta-corriente-page-header">
          <div>
            <p className="cuenta-corriente-page-kicker">Finanzas del proveedor</p>
            <h1>Cuenta corriente</h1>
            <p className="cuenta-corriente-page-subtitle">
              Seguimiento de ordenes de compra, pagos registrados y saldo acumulado por proveedor.
            </p>
          </div>

          <div className="cuenta-corriente-page-client">
            <span>Proveedor</span>
            <strong>{getNombreProveedor(proveedor)}</strong>
            <small>{proveedor?.email || 'Sin email'}</small>
          </div>
        </header>

        <CuentaCorriente proveedor={proveedor} tipoCuenta="PROVEEDOR" />
      </div>
    </section>
  );
}

export default CuentaCorrienteProveedor;
