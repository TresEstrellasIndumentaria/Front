import { useEffect, useRef, useState } from "react";

export default function ProveedorSelect({
    proveedores,
    value,
    onSelect,
    onNuevoProveedor,
}) {
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const ref = useRef(null);

    /* =======================
       CLICK AFUERA
    ======================= */
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtrados = proveedores.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="select-container" ref={ref}>
            <input
                value={value ? value.nombre : busqueda}
                placeholder="Selecciona un proveedor"
                onChange={(e) => {
                    setBusqueda(e.target.value);
                    setAbierto(true);
                }}
                onFocus={() => setAbierto(true)}
                className="select-input"
            />

            {abierto && (
                <div className="dropdown">
                    {filtrados.length === 0 && (
                        <div className="dropdown-item disabled">
                            Todavía no tienes proveedores
                        </div>
                    )}

                    {filtrados.map((p) => (
                        <div
                            key={p._id}
                            className="dropdown-item"
                            onClick={() => {
                                onSelect(p);
                                setBusqueda("");
                                setAbierto(false);
                            }}
                        >
                            {p.nombre}
                        </div>
                    ))}

                    <div
                        className="dropdown-item agregar"
                        onClick={() => {
                            setAbierto(false);
                            onNuevoProveedor();
                        }}
                    >
                        + Añadir proveedor
                    </div>
                </div>
            )}
        </div>
    );
}
