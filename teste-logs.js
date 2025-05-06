/**
 * Teste simples para a funcionalidade de logs
 * Este script testa o endpoint de visualização de logs
 */
const http = require('http');

// URL base da API (ajuste conforme necessário)
const API_URL = 'http://localhost:3001';
let tokenJWT = ''; // Será preenchido após o login

// Função para fazer uma requisição HTTP POST (para login)
function fazerRequisicaoPost(url, dados) {
  return new Promise((resolve, reject) => {
    const dadosString = JSON.stringify(dados);
    
    const opcoes = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dadosString)
      }
    };
    
    const req = http.request(url, opcoes, (res) => {
      let resposta = '';
      
      res.on('data', (parte) => {
        resposta += parte;
      });
      
      res.on('end', () => {
        try {
          const respostaJSON = JSON.parse(resposta);
          resolve({ 
            statusCode: res.statusCode, 
            resposta: respostaJSON
          });
        } catch (erro) {
          resolve({ 
            statusCode: res.statusCode, 
            resposta
          });
        }
      });
    });
    
    req.on('error', (erro) => {
      reject(erro);
    });
    
    req.write(dadosString);
    req.end();
  });
}

// Função para fazer uma requisição HTTP GET (para logs)
function fazerRequisicaoGet(url, token = null) {
  return new Promise((resolve, reject) => {
    const opcoes = {
      method: 'GET',
      headers: {}
    };
    
    // Adicionar token de autenticação se fornecido
    if (token) {
      opcoes.headers['Authorization'] = `Bearer ${token}`;
    }
    
    http.get(url, opcoes, (res) => {
      let resposta = '';
      
      res.on('data', (parte) => {
        resposta += parte;
      });
      
      res.on('end', () => {
        try {
          const respostaJSON = JSON.parse(resposta);
          resolve({ 
            statusCode: res.statusCode, 
            resposta: respostaJSON
          });
        } catch (erro) {
          resolve({ 
            statusCode: res.statusCode, 
            resposta
          });
        }
      });
    }).on('error', (erro) => {
      reject(erro);
    });
  });
}

// Função para realizar login e obter token JWT
async function fazerLogin() {
  console.log('🔑 Fazendo login para obter token JWT...');
  
  try {
    const resultado = await fazerRequisicaoPost(`${API_URL}/api/v1/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (resultado.statusCode === 200 && resultado.resposta.token) {
      tokenJWT = resultado.resposta.token;
      console.log('✅ Login bem-sucedido! Token obtido.');
      return true;
    } else {
      console.log('❌ Falha ao fazer login:', resultado.resposta);
      return false;
    }
  } catch (erro) {
    console.log('❌ Erro ao fazer login:', erro.message);
    return false;
  }
}

// Função para testar o acesso aos logs
async function testarLogs() {
  console.log('\n📋 Iniciando testes de logs...');
  console.log('----------------------------');
  
  // Primeiro faz login para obter o token
  const loginSucesso = await fazerLogin();
  if (!loginSucesso) {
    console.log('❌ Não foi possível continuar os testes sem autenticação.');
    return;
  }
  
  // Casos de teste
  const casos = [
    {
      nome: 'Obter todos os logs (sem filtro)',
      url: `${API_URL}/api/v1/logs`,
      esperado: 200
    },
    {
      nome: 'Obter logs com filtro de nível (info)',
      url: `${API_URL}/api/v1/logs?level=info`,
      esperado: 200
    },
    {
      nome: 'Obter logs com filtro de nível (error)',
      url: `${API_URL}/api/v1/logs?level=error`,
      esperado: 200
    },
    {
      nome: 'Obter logs com paginação',
      url: `${API_URL}/api/v1/logs?page=1&limit=10`,
      esperado: 200
    },
    {
      nome: 'Acessar logs sem token de autenticação',
      url: `${API_URL}/api/v1/logs`,
      semToken: true,
      esperado: 401
    }
  ];
  
  let sucessos = 0;
  let falhas = 0;
  
  // Executando cada caso de teste
  for (const caso of casos) {
    try {
      console.log(`Testando: ${caso.nome}`);
      
      // Decide se usa token ou não
      const token = caso.semToken ? null : tokenJWT;
      const resultado = await fazerRequisicaoGet(caso.url, token);
      
      // Verificando se o status code corresponde ao esperado
      if (resultado.statusCode === caso.esperado) {
        console.log(`✅ SUCESSO! Status: ${resultado.statusCode} (esperado: ${caso.esperado})`);
        
        // Verificações adicionais para respostas bem-sucedidas
        if (resultado.statusCode === 200) {
          if (resultado.resposta.data && resultado.resposta.data.logs) {
            console.log(`📊 ${resultado.resposta.data.logs.length} logs obtidos`);
            if (resultado.resposta.total) {
              console.log(`📈 Total de logs: ${resultado.resposta.total}`);
            }
          }
        }
        
        sucessos++;
      } else {
        console.log(`❌ FALHA! Status: ${resultado.statusCode} (esperado: ${caso.esperado})`);
        console.log('📊 Resposta:', JSON.stringify(resultado.resposta, null, 2));
        falhas++;
      }
    } catch (erro) {
      console.log(`❌ ERRO ao testar "${caso.nome}":`, erro.message);
      falhas++;
    }
    console.log('----------------------------');
  }
  
  // Resultado final
  console.log('🏁 Testes de logs finalizados!');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
}

// Executar os testes
testarLogs().catch(erro => {
  console.error('Erro ao executar testes de logs:', erro);
});