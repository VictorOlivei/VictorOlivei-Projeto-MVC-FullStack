# MVP Architecture

Este repositório contém uma arquitetura mínima viável (MVP) para novos projetos, garantindo que os requisitos não funcionais sejam atendidos desde o início.

## Estrutura do Projeto

O projeto segue o padrão MVC (Model-View-Controller) com uma clara separação de responsabilidades:

```
projeto_arquitetura/
├── config/             # Configurações centralizadas
├── controllers/        # Controladores da aplicação
├── docs/               # Documentação
├── middlewares/        # Middlewares da aplicação
├── models/             # Modelos de dados
├── routes/             # Definição de rotas
├── utils/              # Utilitários e helpers
├── views/              # Camada de visualização (para APIs, representa as respostas)
├── app.js              # Configuração da aplicação Express
├── server.js           # Ponto de entrada da aplicação
└── package.json        # Dependências e scripts
```

## Requisitos Não Funcionais Implementados

- **Autenticação e Autorização**: Login seguro e controle de acesso com JWT
- **Log Estruturado**: Logs de requisições, erros e eventos importantes
- **Tratamento de Exceções**: Centralização de erros e mensagens amigáveis
- **Configuração Centralizada**: Gerenciamento de variáveis sensíveis
- **Monitoramento Básico**: Métricas via endpoint para análise

## Endpoints Mínimos

- **/auth/login**: Implementação de autenticação segura
- **/logs**: Demonstração do sistema de log
- **/health**: Verificação de status da aplicação para monitoramento

## Documentação

A documentação completa da arquitetura está disponível no diretório `docs/`:

- [Documentação Arquitetural](docs/documentacao_arquitetural.md)
- [Diagramas da Arquitetura](docs/diagrama_arquitetura.md)

## Como Executar

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente (opcional): crie um arquivo `.env`
4. Inicie o servidor: `node server.js`

## Tecnologias Utilizadas

- Node.js
- Express
- JWT (JSON Web Tokens)
- Winston (logging)
- Helmet (segurança)
- Dotenv (configuração)

## Licença

MIT
