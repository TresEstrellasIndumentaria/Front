import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RoleRoute = ({ rolesPermitidos, children }) => {
    const user = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    const autorizado = rolesPermitidos.some(r =>
        user.roles.includes(r)
    );

    if (!autorizado) {
        return <Navigate to="/no-autorizado" replace />;
    }

    return children;
};

export default RoleRoute;
