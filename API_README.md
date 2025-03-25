# Instruções para Configuração da API de Autenticação

Este documento contém instruções para configurar e usar a API de autenticação com o aplicativo Personal SM.

## Opções de Configuração

Existem duas maneiras de configurar a autenticação:

1. **Usar uma API existente**: Configure o aplicativo para se conectar à sua API atual
2. **Criar uma API de teste**: Use o servidor de exemplo fornecido para testes

## Opção 1: Conectar a uma API Existente

Se você já tem uma API em funcionamento:

1. Abra o arquivo `src/app/core/services/auth.service.ts`
2. Altere a URL da API para apontar para seu servidor:
   ```typescript
   private apiUrl = 'https://seu-servidor-api.com/api';
   ```
3. Certifique-se de que sua API tenha um endpoint `/auth/login` que:
   - Aceita um POST com `email` e `password` no corpo
   - Retorna uma resposta conforme o modelo:
     ```json
     {
       "success": true,
       "user": {
         "id": 1,
         "email": "usuario@exemplo.com",
         "name": "Nome do Usuário",
         "userType": "aluno" // ou "personal" ou "admin"
       },
       "token": "jwt-token-aqui"
     }
     ```

## Opção 2: Usar a API de Exemplo para Testes

Incluímos um servidor de API simples para testes:

1. Instale as dependências necessárias:
   ```bash
   npm install express cors body-parser jsonwebtoken
   ```

2. Execute o servidor de exemplo:
   ```bash
   node server-example.js
   ```

3. O servidor estará disponível em `http://localhost:3000/api`

4. Certifique-se de que o `auth.service.ts` está configurado para usar esta URL:
   ```typescript
   private apiUrl = 'http://localhost:3000/api';
   ```

## Usuários de Teste Pré-configurados

Se você estiver usando o servidor de exemplo, os seguintes usuários estão disponíveis para teste:

| Email | Senha | Tipo de Usuário |
|-------|-------|-----------------|
| aluno@exemplo.com | senha123 | aluno |
| personal@exemplo.com | senha123 | personal |
| admin@exemplo.com | senha123 | admin |

## Fluxo de Autenticação

1. O usuário insere email e senha no formulário de login
2. O aplicativo envia esses dados para o endpoint `/api/auth/login`
3. A API verifica as credenciais e retorna os dados do usuário e um token JWT
4. O aplicativo armazena essas informações no localStorage
5. O token JWT é incluído em todas as requisições subsequentes
6. O aplicativo redireciona o usuário para a página apropriada com base no tipo de usuário

## Solução de Problemas

Se encontrar problemas com a autenticação:

1. **Erro 401**: Credenciais incorretas (email ou senha)
2. **Erro 404**: Servidor não encontrado (verifique se a API está rodando)
3. **CORS**: Se encontrar erros de CORS, certifique-se de que seu servidor permite solicitações do domínio do seu aplicativo

Para ver logs detalhados:
- Abra o console do navegador (F12)
- Observe as mensagens de log durante a tentativa de login 
