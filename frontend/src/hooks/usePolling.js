import { useCallback, useEffect, useRef, useState } from "react";

// Busca dados de tempos em tempos ("polling").
// Se o servidor cair, mantém os últimos dados recebidos e marca offline = true.
export function usePolling(buscar, intervaloMs = 3000) {
  const [dados, setDados] = useState(null);
  const [offline, setOffline] = useState(false);
  const [erro, setErro] = useState(null);

  const buscarRef = useRef(buscar);
  useEffect(() => {
    buscarRef.current = buscar;
  });

  const atualizar = useCallback(async () => {
    try {
      setDados(await buscarRef.current());
      setOffline(false);
      setErro(null);
    } catch (e) {
      if (e.offline) setOffline(true);
      else setErro(e.message);
    }
  }, []);

  useEffect(() => {
    atualizar();
    const id = setInterval(atualizar, intervaloMs);
    return () => clearInterval(id); // limpa o relógio ao sair da tela
  }, [atualizar, intervaloMs]);

  return { dados, offline, erro, atualizar };
}
