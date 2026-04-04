import { useEffect, useState } from "react";

//Esto mantiene sincronizado el usuario en toda la app.
export const useAuth = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const listener = (e) => setUser(e.detail);
        window.addEventListener("userChanged", listener);

        return () => window.removeEventListener("userChanged", listener);
    }, []);

    return user;
};
