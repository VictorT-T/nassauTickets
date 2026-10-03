// Toda a comunicação com o backend passa por aqui.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, offline = false } = {}) {
    super(mensagem);
    this.status = status;
    this.offline = offline; // true = servidor/banco fora do ar
  }
}

async function requisicao(caminho, { metodo = "GET", corpo } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // fetch só falha assim quando não consegue falar com o servidor
    throw new ErroApi("Não foi possível conectar ao servidor.", { offline: true });
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    // resposta sem corpo
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && token && caminho !== "/auth/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.dispatchEvent(new Event("sessao-expirada"));
    }
    throw new ErroApi(dados?.erro || "Erro inesperado.", {
      status: resposta.status,
      offline: resposta.status === 503,
    });
  }
  return dados;
}

const post = (caminho, corpo) => requisicao(caminho, { metodo: "POST", corpo });

export const api = {
  login: (login, senha) => post("/auth/login", { login, senha }),
  emitirSenha: (tipo) => post("/senhas", { tipo }),
  painel: () => requisicao("/painel"),
  fila: () => requisicao("/atendimento/fila"),
  atual: () => requisicao("/atendimento/atual"),
  chamar: (guiche) => post("/atendimento/chamar", { guiche }),
  chamarNovamente: (id) => post(`/atendimento/${id}/chamar-novamente`),
  iniciar: (id) => post(`/atendimento/${id}/iniciar`),
  finalizar: (id) => post(`/atendimento/${id}/finalizar`),
  naoCompareceu: (id) => post(`/atendimento/${id}/nao-compareceu`),
  relatorio: (tipo, data) => requisicao(`/relatorios?tipo=${tipo}&data=${data}`),
};
