import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import { usePolling } from "../hooks/usePolling.js";
import AvisoOffline from "../components/AvisoOffline.jsx";
import { falar, somDisponivel } from "../utils/audio.js";
import { NOME_TIPO } from "../utils/formatadores.js";

// Texto falado: prioridade, sequencial e guichê. Na segunda chamada começa com "Última chamada".
function montarFrase(s) {
  const inicio = s.chamada === 2 ? "Última chamada. " : "";
  return `${inicio}Senha ${NOME_TIPO[s.tipo].toLowerCase()}, número ${s.sequencia}, guichê ${s.guiche}.`;
}

export default function Painel() {
  const { dados, offline } = usePolling(api.painel, 2000);
  const [somAtivo, setSomAtivo] = useState(false);
  const assinaturaAnterior = useRef(null);

  const chamadas = dados || [];
  const atual = chamadas[0];
  const anteriores = chamadas.slice(1);

  // Detecta uma chamada nova (senha diferente ou segunda chamada) e fala.
  useEffect(() => {
    if (!dados) return;
    const assinatura = atual ? `${atual.numero}-${atual.chamada}` : "vazio";

    if (assinaturaAnterior.current === null) {
      assinaturaAnterior.current = assinatura; // primeira carga: não fala o que já existia
      return;
    }
    if (assinatura !== assinaturaAnterior.current) {
      assinaturaAnterior.current = assinatura;
      if (somAtivo && atual) falar(montarFrase(atual));
    }
  }, [dados, atual, somAtivo]);

  function alternarSom() {
    const novo = !somAtivo;
    setSomAtivo(novo);
    if (novo) falar("Som do painel ativado."); // o clique libera o áudio no navegador
  }

  return (
    <section className="pagina pagina-painel">
      <h1>Painel de chamadas</h1>

      {offline && (
        <AvisoOffline mensagem="Sem conexão com o servidor. As chamadas exibidas podem estar desatualizadas." />
      )}

      <div className="painel-corpo">
        <div aria-live="polite" aria-atomic="true">
          {atual ? (
            <div className="ticket ticket-grande">
              <p className="ticket-rotulo">{atual.chamada === 2 ? "Última chamada" : "Chamando agora"}</p>
              <p className="ticket-numero">{atual.numero}</p>
              <p className="ticket-guiche">Guichê {atual.guiche}</p>
            </div>
          ) : (
            <p className="vazio">{dados ? "Aguardando a primeira chamada do dia." : "Carregando..."}</p>
          )}
        </div>

        <div>
          <h2>Anteriores</h2>
          {anteriores.length === 0 ? (
            <p className="vazio">Nenhuma chamada anterior.</p>
          ) : (
            <ol className="lista-chamadas">
              {anteriores.map((s) => (
                <li key={`${s.numero}-${s.chamada}`}>
                  <strong>{s.numero}</strong>
                  <span>Guichê {s.guiche}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {somDisponivel() && (
        <button type="button" className="botao" aria-pressed={somAtivo} onClick={alternarSom}>
          {somAtivo ? "Desativar som" : "Ativar som"}
        </button>
      )}
    </section>
  );
}
