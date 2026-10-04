import React, { useState } from 'react';

export default function Totem() {
  const [token, setToken] = useState(null);
  const [sequencia, setSequencia] = useState({ SG: 1, SE: 1, SP: 1 });

  const emitirSenha = (tipo) => {
    const data = new Date();
    const yy = String(data.getFullYear()).slice(-2);
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const dd = String(data.getDate()).padStart(2, '0');
    const sq = String(sequencia[tipo]).padStart(3, '0');

    const novoToken = `${yy}${mm}${dd}-${tipo}${sq}`;
    setToken(novoToken);
    setSequencia((prev) => ({ ...prev, [tipo]: prev[tipo] + 1 }));
  };

  return (
    <main className="pagina pagina-totem">
      {!token ? (
        <>
          <h1>Emissão de Senha</h1>
          <p className="subtitulo">Selecione o tipo de atendimento desejado:</p>

          <div className="opcoes">
            <button className="opcao tipo-SG" onClick={() => emitirSenha('SG')}>
              <span className="codigo">SG</span>
              <span className="texto">
                <strong>Senha Geral</strong>
                Atendimento de recepção e cadastro geral.
              </span>
            </button>

            <button className="opcao tipo-SE" onClick={() => emitirSenha('SE')}>
              <span className="codigo">SE</span>
              <span className="texto">
                <strong>Senha Exames</strong>
                Apenas entrega de materiais ou recolha de resultados.
              </span>
            </button>

            <button className="opcao tipo-SP" onClick={() => emitirSenha('SP')}>
              <span className="codigo">SP</span>
              <span className="texto">
                <strong>Senha Prioritária</strong>
                Atendimento preferencial (Idosos, PWD, gestantes, etc.).
              </span>
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h1>Sua Senha foi Emitida!</h1>
          <div className="ticket ticket-grande">
            <p className="ticket-rotulo">RETIRE SUA SENHA</p>
            <p className="ticket-numero">{token}</p>
            <p className="ticket-guiche">Aguarde a chamada no painel</p>
          </div>

          <button className="botao botao-primario" onClick={() => setToken(null)}>
            Emitir Nova Senha
          </button>
        </div>
      )}
    </main>
  );
}