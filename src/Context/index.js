import React, { createContext, useState, useEffect } from 'react';
import { userData } from '../LocalStorage';

export const AppContext = createContext();

const AppProvider = ({ children }) => {
  //estado data usuario logeado, por eso null es un objeto
  const [userLog, setUserLog] = useState(null);
  //estado para login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  //estado nombre admin logeado
  const [nombreUser, setNombreUser] = useState('');
  //estado para el SEARCH
  const [search, setSearch] = useState('');

  const login = () => {
    setIsAuthenticated(true);
  };
  const logout = () => {
    setIsAuthenticated(false);
  };

  //efecto para el login
  useEffect(() => {
    const userLogin = userData();
    if (userLogin) {
      setUserLog(userLogin);
      setIsAuthenticated(true);
      setNombreUser(userLogin.user);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        userLog,
        setUserLog,
        isAuthenticated,
        nombreUser,
        login,
        logout,
        search,
        setSearch,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
