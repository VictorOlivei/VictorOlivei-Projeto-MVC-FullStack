/**
 * Middleware de monitoramento básico
 * Expõe métricas via endpoint para análise futura
 */
const os = require('os');
const process = require('process');

// Armazena métricas da aplicação
const metrics = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  responseTimeTotal: 0,
  responseTimeAvg: 0,
  statusCodes: {},
  endpoints: {}
};

// Middleware para coletar métricas de requisições
const collectMetrics = (req, res, next) => {
  const start = Date.now();
  
  // Incrementa contador de requisições
  metrics.requestCount += 1;
  
  // Registra endpoint
  const endpoint = `${req.method} ${req.originalUrl}`;
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = {
      count: 0,
      responseTimeTotal: 0,
      responseTimeAvg: 0,
      errors: 0
    };
  }
  metrics.endpoints[endpoint].count += 1;
  
  // Função para capturar métricas após a resposta
  const captureMetrics = () => {
    const duration = Date.now() - start;
    
    // Atualiza tempo de resposta total e médio
    metrics.responseTimeTotal += duration;
    metrics.responseTimeAvg = metrics.responseTimeTotal / metrics.requestCount;
    
    // Atualiza métricas do endpoint
    metrics.endpoints[endpoint].responseTimeTotal += duration;
    metrics.endpoints[endpoint].responseTimeAvg = 
      metrics.endpoints[endpoint].responseTimeTotal / metrics.endpoints[endpoint].count;
    
    // Registra código de status
    const statusCode = res.statusCode;
    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
    
    // Registra erro se status >= 400
    if (statusCode >= 400) {
      metrics.errorCount += 1;
      metrics.endpoints[endpoint].errors += 1;
    }
    
    // Remove listeners para evitar memory leaks
    res.removeListener('finish', captureMetrics);
    res.removeListener('close', captureMetrics);
  };
  
  // Adiciona listeners para capturar métricas
  res.on('finish', captureMetrics);
  res.on('close', captureMetrics);
  
  next();
};

// Função para obter métricas do sistema
const getSystemMetrics = () => {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    freeMemory: os.freemem(),
    totalMemory: os.totalmem(),
    loadAvg: os.loadavg()
  };
};

// Função para obter todas as métricas
const getMetrics = () => {
  return {
    application: {
      uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      errorRate: metrics.requestCount ? (metrics.errorCount / metrics.requestCount) * 100 : 0,
      responseTimeAvg: metrics.responseTimeAvg,
      statusCodes: metrics.statusCodes,
      endpoints: metrics.endpoints
    },
    system: getSystemMetrics()
  };
};

module.exports = {
  collectMetrics,
  getMetrics
};
