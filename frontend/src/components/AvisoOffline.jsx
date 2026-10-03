export default function AvisoOffline({ mensagem }) {
  return (
    <div className="aviso aviso-offline" role="alert">
      {mensagem || "Sistema temporariamente indisponível. Tentando reconectar automaticamente."}
    </div>
  );
}
