const getItemNombre = (item) => {
    if (!item) return "-";
    if (item.nombre) return item.nombre;
    if (typeof item.articulo === "object") return item.articulo?.nombre || "-";
    return typeof item.articulo === "string" ? item.articulo : "-";
};

function OrdenCompraPrint({ orden, proveedor, direccion, telefono, formatFecha }) {
    const items = orden?.items || orden?.articulos || [];
    const total = Number(orden?.totalOrden ?? orden?.total ?? 0);
    const numeroOrden = orden?.numero ? String(orden.numero).replace(/^PO/i, "") : "---";

    return (
        <section className="oc-print-sheet" aria-label="Orden de compra imprimible">
            <header className="oc-print-header">
                <div>
                    <span>Orden de compra</span>
                    <h1>{numeroOrden}</h1>
                </div>
                <div className="oc-print-meta">
                    <p><strong>Fecha:</strong> {formatFecha(orden?.fechaOrden)}</p>
                    <p><strong>Estado:</strong> {orden?.estado === "PAGADA" ? "Pagada" : "Deudor"}</p>
                </div>
            </header>

            <div className="oc-print-provider">
                <strong>Proveedor</strong>
                <p>{proveedor?.nombre || ""} {proveedor?.apellido || ""}</p>
                <p>{direccion}</p>
                <p>{telefono}</p>
                <p>{proveedor?.email || "-"}</p>
            </div>

            <table className="oc-print-table">
                <thead>
                    <tr>
                        <th>Articulo</th>
                        <th>Talle</th>
                        <th>Cantidad</th>
                        <th>Costo</th>
                        <th>Importe</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const coste = Number(item.coste ?? item.costo ?? 0);
                        const cantidad = Number(item.cantidad || 0);
                        const importe = Number(item.costoTotal ?? item.subtotal ?? cantidad * coste);
                        return (
                            <tr key={`${getItemNombre(item)}-${idx}`}>
                                <td>{getItemNombre(item)}</td>
                                <td>{item.talle || "-"}</td>
                                <td>{cantidad}</td>
                                <td>${coste.toLocaleString("es-AR")}</td>
                                <td>${importe.toLocaleString("es-AR")}</td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="4">Total</td>
                        <td>${total.toLocaleString("es-AR")}</td>
                    </tr>
                </tfoot>
            </table>

            {orden?.anotaciones ? (
                <div className="oc-print-notes">
                    <strong>Anotaciones</strong>
                    <p>{orden.anotaciones}</p>
                </div>
            ) : null}
        </section>
    );
}

export default OrdenCompraPrint;
