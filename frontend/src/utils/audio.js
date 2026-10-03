// Áudio da chamada usando a voz do próprio navegador (Web Speech API).
export function somDisponivel() {
  return "speechSynthesis" in window;
}

export function falar(texto) {
  if (!somDisponivel()) return;
  window.speechSynthesis.cancel(); // interrompe uma fala anterior
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.rate = 0.9;
  window.speechSynthesis.speak(fala);
}