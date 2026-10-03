-- nassauTickets - Esquema do banco de dados (MySQL 8.0)
-- Para executar:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS nassautickets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE nassautickets;

-- Usuários que fazem login: o atendente (AA) e o gestor.
-- O cliente (AC) é anônimo e NÃO possui cadastro (LGPD: nenhum dado pessoal do cliente é coletado).
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  login       VARCHAR(50)  NOT NULL UNIQUE,
  senha_hash  VARCHAR(100) NOT NULL,              -- hash bcrypt, nunca a senha em texto
  perfil      ENUM('ATENDENTE','GESTOR') NOT NULL DEFAULT 'ATENDENTE',
  ativo       TINYINT(1)   NOT NULL DEFAULT 1,
  criado_em   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

-- Contador da sequência (SQ) por dia e por tipo. Reinicia todo dia automaticamente
-- porque cada dia ganha uma linha nova.
CREATE TABLE IF NOT EXISTS contadores (
  data    DATE    NOT NULL,
  tipo    CHAR(2) NOT NULL,
  ultimo  INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (data, tipo)
);

-- Linha única usada como "trava" para que dois atendentes não escolham a mesma senha
-- ao mesmo tempo (concorrência) e para lembrar o tipo da última senha chamada.
CREATE TABLE IF NOT EXISTS controle_fila (
  id           TINYINT UNSIGNED PRIMARY KEY,
  ultimo_tipo  CHAR(2) NULL,
  ultimo_dia   DATE    NULL
);
INSERT IGNORE INTO controle_fila (id) VALUES (1);

-- Senhas. Esta tabela também serve de base para os relatórios e a auditoria.
-- Obs.: o estado "NÃO_COMPARECEU" é gravado como NAO_COMPARECEU (sem acento) no banco
--       e exibido com acento na tela. DESCARTADA é usado para as senhas que sobram no fim do expediente.
CREATE TABLE IF NOT EXISTS senhas (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero                VARCHAR(20) NOT NULL UNIQUE,       -- YYMMDD-PPSQ
  tipo                  ENUM('SP','SG','SE') NOT NULL,
  sequencia             INT UNSIGNED NOT NULL,
  data_emissao          DATE NOT NULL,
  estado                ENUM('EMITIDA','AGUARDANDO','CHAMADA','CHAMADA_NOVAMENTE',
                             'EM_ATENDIMENTO','ATENDIDA','NAO_COMPARECEU','DESCARTADA')
                        NOT NULL DEFAULT 'EMITIDA',
  atendente_id          INT UNSIGNED NULL,
  guiche                TINYINT UNSIGNED NULL,
  emitida_em            DATETIME(3) NOT NULL,
  primeira_chamada_em   DATETIME(3) NULL,
  segunda_chamada_em    DATETIME(3) NULL,
  inicio_atendimento_em DATETIME(3) NULL,
  fim_atendimento_em    DATETIME(3) NULL,
  CONSTRAINT fk_senhas_usuario FOREIGN KEY (atendente_id) REFERENCES usuarios(id),
  UNIQUE KEY uq_dia_tipo_seq (data_emissao, tipo, sequencia),
  INDEX idx_fila (data_emissao, estado, tipo, id),
  INDEX idx_painel (data_emissao, primeira_chamada_em)
);
