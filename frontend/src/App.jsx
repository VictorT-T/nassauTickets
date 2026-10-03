import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RotaProtegida from "./components/RotaProtegida.jsx";
import Totem from "./pages/Totem.jsx";
import Painel from "./pages/Painel.jsx";
import Login from "./pages/Login.jsx";
import Atendente from "./pages/Atendente.jsx";
import Relatorios from "./pages/Relatorios.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/totem" replace />} />
        <Route path="/totem" element={<Totem />} />
        <Route path="/painel" element={<Painel />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/atendente"
          element={
            <RotaProtegida>
              <Atendente />
            </RotaProtegida>
          }
        />
        <Route
          path="/relatorios"
          element={
            <RotaProtegida perfis={["GESTOR"]}>
              <Relatorios />
            </RotaProtegida>
          }
        />
        <Route path="*" element={<p className="pagina">Página não encontrada.</p>} />
      </Route>
    </Routes>
  );
}
