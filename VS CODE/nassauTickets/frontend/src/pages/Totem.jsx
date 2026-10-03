import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import AvisoOffline from "../components/AvisoOffline.jsx";
import { NOME_TIPO } from "../utils/formatadores.js";

const OPCOES = [
  { tipo: "SP", titulo: "Atendimento prioritário", detalhe: "Idosos, gestantes, lactantes e pessoas com deficiência" },
  { tipo: "SE", titulo: "Retirada de exames", detalhe: "Para quem já fez o exame e vai buscar o resultado" },
  { tipo: "SG", titulo: "Atendimento geral", detalhe: "Cadastro, coleta e demais atendimentos" },
];

export default function Totem() {
  const [emitida, setEmitida] = useState(null);
  const [erro, setErro] = useState("");
  const [offline, setOffline] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Some com a senha da tela depois de 12 segundos, deixando o totem pronto para o próximo.
  useEffect(() => {
    if (!emitida) return;
    const relogio = setTimeout(() => setEmitida(null), 12000);
    return () => clearTimeout(relogio);
  }, [emitida]);

  async function emitir(tipo) {
    setCarregando(true);
    setErro("");
    setOffline(false);
    try {
      setEmitida(await api.emitirSenha(tipo));
    } catch (e) {
      if (e.offline) setOffline(true);
      else setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="pagina pagina-totem">
      <h1>Retire sua senha</h1>
      <p className="subtitulo">Toque na opção que corresponde ao seu atendimento.</p>

      {offline && (
        <AvisoOffline mensagem="Totem temporariamente indisponível. Dirija-se à recepção para ser atendido." />
      )}
      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="opcoes">
        {OPCOES.map((o) => (
          <button key={o.tipo} type="button" className={`opcao tipo-${o.tipo}`} disabled={carregando} onClick={() => emitir(o.tipo)}>
            <span className="codigo" aria-hidden="true">
              {o.tipo}
            </span>
            <span className="texto">
              <strong>{o.titulo}</strong>
              <span>{o.detalhe}</span>
            </span>
          </button>
        ))}
      </div>

      {/* aria-live: leitores de tela anunciam a senha assim que ela aparece */}
      <div aria-live="polite" aria-atomic="true">
        {emitida && (
          <div className="ticket">
            <p className="ticket-rotulo">Sua senha ({NOME_TIPO[emitida.tipo]})</p>
            <p className="ticket-numero">{emitida.numero}</p>
            <p className="ticket-guiche">Aguarde ser chamado no painel.</p>
          </div>
        )}
      </div>
    </section>
  );
}
