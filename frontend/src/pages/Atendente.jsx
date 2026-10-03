import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { usePolling } from "../hooks/usePolling.js";
import AvisoOffline from "../components/AvisoOffline.jsx";
import { NOME_ESTADO, NOME_TIPO } from "../utils/formatadores.js";

export default function Atendente() {
  const { usuario } = useAuth();
  const [guiche, setGuiche] = useState(() => Number(localStorage.getItem("guiche")) || 1);
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const fila = usePolling(api.fila, 3000);
  const atual = usePolling(api.atual, 3000);

  const offline = fila.offline || atual.offline;
  const senha = atual.dados?.senha || null;
  const aguardando = fila.dados?.aguardando || { SP: 0, SE: 0, SG: 0 };
  const total = aguardando.SP + aguardando.SE + aguardando.SG;
  const expedienteFechado = Boolean(fila.dados) && !fila.dados.expediente_aberto;
  const estado = senha?.estado;

  function mudarGuiche(evento) {
    const valor = Number(evento.target.value);
    setGuiche(valor);
    localStorage.setItem("guiche", String(valor));
  }

  // Executa uma ação e depois atualiza a tela. Erros viram mensagem para o atendente.
  async function executar(acao) {
    setOcupado(true);
    setMensagem("");
    try {
      await acao();
    } catch (e) {
      setMensagem(e.offline ? "Servidor indisponível. Tente novamente." : e.message);
    } finally {
      setOcupado(false);
      await Promise.all([fila.atualizar(), atual.atualizar()]);
    }
  }

  const podeChamar = !ocupado && !offline && !senha && total > 0 && guiche >= 1 && !expedienteFechado;

  return (
    <section className="pagina">
      <h1>Atendimento</h1>
      <p>Atendente: {usuario.nome}</p>

      {offline && <AvisoOffline mensagem="Sem conexão com o servidor. Os botões voltam a funcionar quando a conexão for restabelecida." />}
      {expedienteFechado && <p className="aviso">Fora do horário de atendimento (07h às 17h).</p>}
      {mensagem && (
        <p className="aviso aviso-erro" role="alert">
          {mensagem}
        </p>
      )}

      <div className="atendente-grade">
        <div>
          <h2>Senha atual</h2>
          {senha ? (
            <div className="ticket">
              <p className="ticket-rotulo">{NOME_TIPO[senha.tipo]}</p>
              <p className="ticket-numero">{senha.numero}</p>
              <p className="ticket-guiche">
                Guichê {senha.guiche} - {NOME_ESTADO[senha.estado]}
              </p>
            </div>
          ) : (
            <p className="vazio">Nenhuma senha em atendimento.</p>
          )}
        </div>

        <div>
          <h2>Fila de espera</h2>
          <ul className="fila-contagem">
            <li>Prioritárias: <strong>{aguardando.SP}</strong></li>
            <li>Retirada de exames: <strong>{aguardando.SE}</strong></li>
            <li>Gerais: <strong>{aguardando.SG}</strong></li>
          </ul>

          <label htmlFor="guiche">Meu guichê</label>
          <input id="guiche" type="number" min="1" max="99" value={guiche} onChange={mudarGuiche} className="campo-curto" />
        </div>
      </div>

      <div className="acoes">
        <button type="button" className="botao botao-primario" disabled={!podeChamar} onClick={() => executar(() => api.chamar(guiche))}>
          Chamar próxima
        </button>
        <button type="button" className="botao" disabled={ocupado || estado !== "CHAMADA"} onClick={() => executar(() => api.chamarNovamente(senha.id))}>
          Chamar novamente
        </button>
        <button type="button" className="botao" disabled={ocupado || (estado !== "CHAMADA" && estado !== "CHAMADA_NOVAMENTE")} onClick={() => executar(() => api.iniciar(senha.id))}>
          Iniciar atendimento
        </button>
        <button type="button" className="botao" disabled={ocupado || estado !== "EM_ATENDIMENTO"} onClick={() => executar(() => api.finalizar(senha.id))}>
          Finalizar atendimento
        </button>
        <button type="button" className="botao" disabled={ocupado || estado !== "CHAMADA_NOVAMENTE"} onClick={() => executar(() => api.naoCompareceu(senha.id))}>
          Cliente não compareceu
        </button>
      </div>
      <p className="dica">O botão "Cliente não compareceu" só libera depois da segunda chamada.</p>
    </section>
  );
}
