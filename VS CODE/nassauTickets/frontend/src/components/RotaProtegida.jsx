import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Só mostra a página se houver login (e, se pedido, o perfil correto).
export default function RotaProtegida({ children, perfis }) {
  const { usuario } = useAuth();
  const local = useLocation();

  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to="/atendente" replace />;
  return children;
}
