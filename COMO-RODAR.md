# nassauTickets - como rodar (cole o essencial no README do repositório)

## Requisitos
- Node.js LTS 22
- MySQL 8.0 (servidor instalado e ligado)

## 1. Banco de dados
Na pasta `backend/`:

    mysql -u root -p < database/schema.sql

(No Windows, se o comando acima não funcionar no terminal, abra o MySQL Workbench,
abra o arquivo `database/schema.sql` e clique no raio para executar.)

## 2. Backend
    cd backend
    cp .env.example .env        # depois edite o .env (senha do MySQL e JWT_SECRET)
    npm install
    npm run seed -- "Gestor" gestor Senha@1234 GESTOR   # cria o login do atendente/gestor
    npm run dev                 # API em http://localhost:3000

Testes automáticos das regras de prioridade e da numeração: `npm test`

## 3. Frontend
    cd frontend
    npm install
    npm run dev                 # site em http://localhost:5173

## 4. Telas
| Endereço | Quem usa | Login |
|---|---|---|
| /totem | Cliente | não |
| /painel | TV da recepção | não |
| /login, /atendente | Atendente | sim |
| /relatorios | Gestor | sim (perfil GESTOR) |

## 5. Como testar o fluxo
1. Abra /totem e emita senhas SP, SE e SG.
2. Abra /painel em outra aba e clique em "Ativar som".
3. Entre em /login, vá em Atendimento e use: Chamar próxima, Chamar novamente,
   Iniciar atendimento, Finalizar atendimento.
4. Entre como gestor e veja /relatorios.

Fora do horário 07h-17h as chamadas ficam bloqueadas. Para testar fora do horário,
deixe `IGNORAR_EXPEDIENTE=true` no `.env` (use `false` na apresentação final).
