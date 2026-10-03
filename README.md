# nassauTickets

## Descrição
Sistema de controle de atendimento (emissão e chamada de senhas) para um Laboratório de Análises Clínicas.

## Objetivo
Aplicar Git, GitHub e React no desenvolvimento em equipe de um sistema de filas com regras de priorização, seguindo os conceitos estudados na disciplina.

## Tecnologias
- Frontend: React
- Backend: [a definir — Node.js/Express, Java/Spring Boot ou Python/Flask-FastAPI]
- Banco de dados: MySQL 8.0

## Arquitetura
[Breve visão geral: totem emite senha → backend grava no banco e decide a fila → painel e tela do atendente consultam o backend]

## Branches
- `main`: versão integrada e estável do projeto.
- `dev`: branch de desenvolvimento. Todo código é enviado primeiro aqui, depois integrado à `main` por merge.

## Instalação
Pré-requisito: [Node.js](https://nodejs.org) e MySQL 8.0 instalados (ou acesso a um banco MySQL).

```bash
git clone https://github.com/VictorT-T/nassauTickets.git
cd nassauTickets/frontend
npm install
```

## Execução
```bash
npm run dev
```

## Configuração
[Variáveis de ambiente do backend, string de conexão do banco — detalhar quando o backend for implementado]

## Membros

| Nome | Matrícula | Papel |
|--------------------------|-------|--------------|
|Victor Hugo Araujo de Melo|1912395| Scrum Master |
|      |           | Documentador |
|      |           | Documentador |
|      |           | Desenvolvedor |
|      |           | Desenvolvedor |
|      |           | Testador |

## Licença
Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).