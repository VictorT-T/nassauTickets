import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import AvisoOffline from "../components/AvisoOffline.jsx";
import { NOME_ESTADO, NOME_TIPO, formatarDataHora, formatarDuracao, hojeLocal } from "../utils/formatadores.js";

const TIPOS = ["SP", "SE", "SG"];

export default function Relatorios() {
  const [tipo, setTipo] = useState("diario");
  const [data, setData] = useState(hojeLocal());
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState("");
  const [offline, setOffline] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function gerar(evento) {
    if (evento) evento.preventDefault();
    setCarregando(true);
    setErro("");
    setOffline(false);
    try {
      setRelatorio(await api.relatorio(tipo, data));
    } catch (e) {
      if (e.offline) setOffline(true);
      else setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  // Gera o relatório do dia assim que a tela abre.
  useEffect(() => {
    gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = relatorio?.total;

  return (
    <section className="pagina pagina-larga">
      <h1>Relatórios</h1>

      <form onSubmit={gerar} className="filtros">
        <label htmlFor="tipo">Período</label>
        <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="diario">Diário</option>
          <option value="mensal">Mensal</option>
        </select>

        <label htmlFor="data">{tipo === "mensal" ? "Qualquer dia do mês" : "Dia"}</label>
        <input id="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />

        <button type="submit" className="botao botao-primario" disabled={carregando}>
          {carregando ? "Gerando..." : "Gerar relatório"}
        </button>
        <button type="button" className="botao" onClick={() => window.print()}>
          Imprimir
        </button>
      </form>

      {offline && <AvisoOffline mensagem="Servidor indisponível. Tente gerar o relatório novamente em instantes." />}
      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {relatorio && (
        <>
          <p>
            Período: {relatorio.periodo.inicio} até {relatorio.periodo.fim}
          </p>

          <h2>Resumo geral</h2>
          <dl className="indicadores">
            <div><dt>Senhas emitidas</dt><dd>{total.emitidas}</dd></div>
            <div><dt>Senhas atendidas</dt><dd>{total.atendidas}</dd></div>
            <div><dt>Não compareceram</dt><dd>{total.nao_compareceu}</dd></div>
            <div><dt>Descartadas</dt><dd>{total.descartadas}</dd></div>
            <div><dt>Tempo médio de atendimento</dt><dd>{formatarDuracao(total.tm_segundos)}</dd></div>
            <div><dt>Espera média até a chamada</dt><dd>{formatarDuracao(total.espera_segundos)}</dd></div>
          </dl>

          <h2>Por prioridade e tempo médio (TM)</h2>
          <div className="tabela-rolagem">
            <table>
              <caption className="so-leitor">Senhas por prioridade</caption>
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Emitidas</th>
                  <th scope="col">Atendidas</th>
                  <th scope="col">Não compareceram</th>
                  <th scope="col">Descartadas</th>
                  <th scope="col">TM real</th>
                  <th scope="col">TM de referência</th>
                  <th scope="col">Espera média</th>
                </tr>
              </thead>
              <tbody>
                {TIPOS.map((t) => {
                  const l = relatorio.por_prioridade[t];
                  return (
                    <tr key={t}>
                      <th scope="row">{t} - {NOME_TIPO[t]}</th>
                      <td>{l.emitidas}</td>
                      <td>{l.atendidas}</td>
                      <td>{l.nao_compareceu}</td>
                      <td>{l.descartadas}</td>
                      <td>{formatarDuracao(l.tm_segundos)}</td>
                      <td>{relatorio.referencia_tm_minutos[t]} min</td>
                      <td>{formatarDuracao(l.espera_segundos)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2>Relatório detalhado das senhas</h2>
          <div className="tabela-rolagem">
            <table>
              <caption className="so-leitor">Senhas do período</caption>
              <thead>
                <tr>
                  <th scope="col">Senha</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Emissão</th>
                  <th scope="col">Atendimento</th>
                  <th scope="col">Guichê</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.detalhado.length === 0 && (
                  <tr><td colSpan="6">Nenhuma senha no período.</td></tr>
                )}
                {relatorio.detalhado.map((s) => (
                  <tr key={s.numero}>
                    <th scope="row">{s.numero}</th>
                    <td>{s.tipo}</td>
                    <td>{NOME_ESTADO[s.estado]}</td>
                    <td>{formatarDataHora(s.emitida_em)}</td>
                    <td>{formatarDataHora(s.inicio_atendimento_em)}</td>
                    <td>{s.guiche ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Relatório de auditoria</h2>
          <div className="tabela-rolagem">
            <table>
              <caption className="so-leitor">Auditoria das chamadas</caption>
              <thead>
                <tr>
                  <th scope="col">Atendente</th>
                  <th scope="col">Guichê</th>
                  <th scope="col">Senha</th>
                  <th scope="col">1ª chamada</th>
                  <th scope="col">2ª chamada</th>
                  <th scope="col">Início</th>
                  <th scope="col">Fim</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.auditoria.length === 0 && (
                  <tr><td colSpan="7">Nenhuma chamada no período.</td></tr>
                )}
                {relatorio.auditoria.map((a) => (
                  <tr key={a.numero}>
                    <td>{a.atendente}</td>
                    <td>{a.guiche}</td>
                    <th scope="row">{a.numero}</th>
                    <td>{formatarDataHora(a.primeira_chamada_em)}</td>
                    <td>{formatarDataHora(a.segunda_chamada_em)}</td>
                    <td>{formatarDataHora(a.inicio_atendimento_em)}</td>
                    <td>{formatarDataHora(a.fim_atendimento_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
