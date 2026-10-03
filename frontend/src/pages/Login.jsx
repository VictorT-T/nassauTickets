import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const local = useLocation();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault(); // impede a página de recarregar
    setErro("");
    setCarregando(true);
    try {
      await entrar(login, senha);
      navigate(local.state?.de || "/atendente", { replace: true });
    } catch (e) {
      setErro(e.offline ? "Servidor indisponível. Tente novamente em instantes." : e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="pagina pagina-estreita">
      <h1>Entrar</h1>
      <p>Acesso para atendentes e gestor.</p>

      <form onSubmit={enviar} className="formulario">
        <label htmlFor="login">Login</label>
        <input id="login" type="text" autoComplete="username" required value={login} onChange={(e) => setLogin(e.target.value)} />

        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />

        {erro && (
          <p className="aviso aviso-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao botao-primario" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}
