/**
 * Controlador de logs
 * Implementa funcionalidades para visualização e gerenciamento de logs
 */
const fs = require('fs').promises;
const path = require('path');
const { catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Controlador para obter logs
const getLogs = catchAsync(async (req, res, next) => {
  // Parâmetros de consulta para filtragem
  const { level = 'all', limit = 100, page = 1 } = req.query;
  
  try {
    // Caminho para o arquivo de log
    const logPath = path.join(process.cwd(), 'logs', 'app.log');
    
    // Verificar se o arquivo existe
    await fs.access(logPath);
    
    // Ler o arquivo de log
    const logData = await fs.readFile(logPath, 'utf8');
    
    // Processar logs (converter de formato JSON por linha para array de objetos)
    let logs = logData
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (err) {
          return { raw: line, parseError: true };
        }
      });
    
    // Filtrar por nível de log se especificado
    if (level !== 'all') {
      logs = logs.filter(log => log.level === level);
    }
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    // Registrar acesso aos logs
    logger.info({
      type: 'logs_access',
      user: req.user ? req.user.id : 'anonymous',
      filters: { level, limit, page }
    });
    
    // Enviar resposta
    res.status(200).json({
      status: 'success',
      results: paginatedLogs.length,
      total: logs.length,
      page,
      limit,
      data: {
        logs: paginatedLogs
      }
    });
  } catch (err) {
    // Se o arquivo não existir ou houver outro erro
    if (err.code === 'ENOENT') {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          logs: []
        },
        message: 'Nenhum arquivo de log encontrado'
      });
    }
    
    // Registrar erro e repassar
    logger.error({
      type: 'logs_access_error',
      error: err.message,
      stack: err.stack
    });
    
    throw err;
  }
});

module.exports = {
  getLogs
};
