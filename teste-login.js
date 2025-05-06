/**
 * Teste simples para a funcionalidade de login
 * Este script testa o endpoint de login com credenciais válidas e inválidas
 */
const http = require('http');

// URL base da API (ajuste conforme necessário)
const API_URL = 'http://localhost:3001'; 

// Função para fazer uma requisição HTTP POST
function fazerRequisicaoPost(url, dados) {
  return new Promise((resolve, reject) => {
    // Preparando os dados para envio
    const dadosString = JSON.stringify(dados);
    
    // Opções da requisição
    const opcoes = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dadosString)
      }
    };
    
    // Criando a requisição
    const req = http.request(url, opcoes, (res) => {
      let resposta = '';
      
      // Recebendo os dados
      res.on('data', (parte) => {
        resposta += parte;
      });
      
      // Finalizando a requisição
      res.on('end', () => {
        try {
          // Tentando converter a resposta para JSON
          const respostaJSON = JSON.parse(resposta);
          resolve({ 
            statusCode: res.statusCode, 
            resposta: respostaJSON, 
            headers: res.headers 
          });
        } catch (erro) {
          // Se não for um JSON válido, retorna a string
          resolve({ 
            statusCode: res.statusCode, 
            resposta, 
            headers: res.headers 
          });
        }
      });
    });
    
    // Tratando erros da requisição
    req.on('error', (erro) => {
      reject(erro);
    });
    
    // Enviando os dados
    req.write(dadosString);
    req.end();
  });
}

// Função para testar o login com diferentes credenciais
async function testarLogin() {
  console.log('🔐 Iniciando testes de login...');
  console.log('----------------------------');
  
  // Casos de teste
  const casos = [
    {
      nome: 'Login com credenciais válidas (admin)',
      dados: { email: 'admin@example.com', password: 'password123' },
      esperado: 200
    },
    {
      nome: 'Login com credenciais válidas (usuário comum)',
      dados: { email: 'user@example.com', password: 'password123' },
      esperado: 200
    },
    {
      nome: 'Login com senha incorreta',
      dados: { email: 'admin@example.com', password: 'senhaerrada' },
      esperado: 401
    },
    {
      nome: 'Login com email não cadastrado',
      dados: { email: 'naoexiste@example.com', password: 'password123' },
      esperado: 401
    },
    {
      nome: 'Login sem informar email',
      dados: { password: 'password123' },
      esperado: 400
    },
    {
      nome: 'Login sem informar senha',
      dados: { email: 'admin@example.com' },
      esperado: 400
    }
  ];
  
  let sucessos = 0;
  let falhas = 0;
  
  // Executando cada caso de teste
  for (const caso of casos) {
    try {
      console.log(`Testando: ${caso.nome}`);
      const resultado = await fazerRequisicaoPost(`${API_URL}/api/v1/auth/login`, caso.dados);
      
      // Verificando se o status code corresponde ao esperado
      if (resultado.statusCode === caso.esperado) {
        console.log(`✅ SUCESSO! Status: ${resultado.statusCode} (esperado: ${caso.esperado})`);
        if (resultado.statusCode === 200) {
          console.log('🔑 Token JWT recebido:', resultado.resposta.token ? '✓' : '✗');
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
  console.log('🏁 Testes de login finalizados!');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
}

// Executar os testes
testarLogin().catch(erro => {
  console.error('Erro ao executar testes de login:', erro);
});