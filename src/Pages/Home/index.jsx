import React from 'react';
import { Link } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import TuneIcon from '@mui/icons-material/Tune';
import tresEstLogo from '../../Images/tresEst-black.png';
import { userData } from '../../LocalStorage';
import './styles.css';

function Home() {
    const user = userData();
    const nombre = user?.user?.nombre || user?.nombre || 'usuario';

    const accesos = [
        {
            title: 'Articulos',
            text: 'Consulta y administra el catalogo de productos.',
            to: '/listaArticulos',
            Icon: Inventory2Icon,
        },
        {
            title: 'Ventas',
            text: 'Carga nuevas ventas desde el formulario de remitos.',
            to: '/ventas/nueva',
            Icon: PointOfSaleIcon,
        },
        {
            title: 'Inventario',
            text: 'Gestiona stock, ajustes y movimientos.',
            to: '/ajusteDeStock',
            Icon: TuneIcon,
        },
        {
            title: 'Informes',
            text: 'Analiza resumenes y rendimiento comercial.',
            to: '/resumenVentas',
            Icon: AssessmentIcon,
        },
    ];

    return (
        <section className="home-welcome">
            <div className="home-hero">
                <div>
                    <span className="home-kicker">Tres Estrellas</span>
                    <h1>Bienvenido, {nombre}</h1>
                    <p>
                        Panel de gestion para operar ventas, inventario, clientes e informes
                        desde un mismo lugar.
                    </p>
                </div>
                {/* Logo */}
                <div className="home-brand-mark" aria-hidden="true">
                    <img src={tresEstLogo} alt=""/>
                </div>
            </div>

            <div className="home-quick-grid">
                {accesos.map(({ title, text, to, Icon }) => (
                    <Link className="home-quick-card" to={to} key={to}>
                        <div className="home-card-icon">
                            <Icon />
                        </div>
                        <div>
                            <h2>{title}</h2>
                            <p>{text}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default Home;
