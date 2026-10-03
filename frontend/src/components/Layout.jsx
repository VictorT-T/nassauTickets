import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  function aoSair() {
    sair();
    navigate("/login");
  }

  return (
    <>
      <a className="pular" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="topo">
        <span className="marca">nassauTickets</span>
        <nav aria-label="Principal">
          <NavLink to="/totem">Totem</NavLink>
          <NavLink to="/painel">Painel</NavLink>
          {usuario && <NavLink to="/atendente">Atendimento</NavLink>}
          {usuario?.perfil === "GESTOR" && <NavLink to="/relatorios">Relatórios</NavLink>}
          {usuario ? (
            <button type="button" className="botao-link" onClick={aoSair}>
              Sair ({usuario.nome})
            </button>
          ) : (
            <NavLink to="/login">Entrar</NavLink>
          )}
        </nav>
      </header>
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
