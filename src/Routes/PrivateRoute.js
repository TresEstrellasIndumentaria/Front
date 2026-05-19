import { Navigate, Outlet } from "react-router-dom";
import { userData } from "../LocalStorage";
import { usuarioTieneAlgunPermiso } from "../Config/permisos";

function PrivateRoute({ allowedRoles, allowedPermissions }) {
    const user = userData();

    // No logueado
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si se pasan roles permitidos, validarlos
    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = user.roles || [];

        const tienePermiso = allowedRoles.some(r =>
            userRoles.includes(r)
        );

        if (!tienePermiso) {
            return <Navigate to="/" replace />;
        }
    }

    if (allowedPermissions && allowedPermissions.length > 0) {
        const tienePermiso = usuarioTieneAlgunPermiso(user, allowedPermissions);

        if (!tienePermiso) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}

export default PrivateRoute;
