import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  });

  // Se o token expirar, a api avisa e a sessão é encerrada.
  useEffect(() => {
    const encerrar = () => setUsuario(null);
    window.addEventListener("sessao-expirada", encerrar);
    return () => window.removeEventListener("sessao-expirada", encerrar);
  }, []);

  async function entrar(login, senha) {
    const resposta = await api.login(login, senha);
    localStorage.setItem("token", resposta.token);
    localStorage.setItem("usuario", JSON.stringify(resposta.usuario));
    setUsuario(resposta.usuario);
  }

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, entrar, sair }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
