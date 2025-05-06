/**
 * Controlador de saúde da aplicação
 * Implementa endpoint para monitoramento básico do sistema
 */
const { catchAsync } = require('../middlewares/errorHandler');
const { getMetrics } = require('../middlewares/monitoringMiddleware');
const logger = require('../utils/logger');

// Controlador para verificar a saúde da aplicação
const checkHealth = catchAsync(async (req, res, next) => {
  // Log detalhado da verificação de saúde
  logger.info({
    type: 'health_check_initiated',
    source: req.ip,
    requestId: req.requestId,
    userAgent: req.get('user-agent')
  });

  // Obter métricas da aplicação e do sistema
  const metrics = getMetrics();
  
  // Verificar status dos componentes principais
  const components = {
    api: {
      status: 'healthy',
      uptime: metrics.application.uptime
    },
    database: {
      // Simulado para o MVP
      status: 'healthy',
      responseTime: '5ms'
    },
    // Outros componentes podem ser adicionados conforme necessário
  };
  
  // Calcular status geral com base nos componentes
  const overallStatus = Object.values(components).every(
    component => component.status === 'healthy'
  ) ? 'healthy' : 'degraded';
  
  // Log detalhado do status do sistema
  logger.info({
    type: 'health_status',
    status: overallStatus,
    components: JSON.stringify(components),
    metrics: {
      requests: metrics.application.requestCount,
      errors: metrics.application.errorCount,
      errorRate: metrics.application.errorRate,
      avgResponseTime: metrics.application.responseTimeAvg
    },
    system: {
      freeMemory: Math.round(metrics.system.freeMemory / 1024 / 1024),
      totalMemory: Math.round(metrics.system.totalMemory / 1024 / 1024),
      memoryUsagePercent: (100 - (metrics.system.freeMemory / metrics.system.totalMemory) * 100).toFixed(2),
      loadAvg: metrics.system.loadAvg
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });

  // Se algum componente não estiver saudável, registrar um aviso
  if (overallStatus !== 'healthy') {
    logger.warn({
      type: 'system_degraded',
      components: Object.entries(components)
        .filter(([_, data]) => data.status !== 'healthy')
        .map(([name]) => name),
      metrics: {
        errorRate: metrics.application.errorRate,
        avgResponseTime: metrics.application.responseTimeAvg
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  // Enviar resposta
  res.status(200).json({
    status: 'success',
    data: {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components,
      metrics: {
        requests: {
          total: metrics.application.requestCount,
          errors: metrics.application.errorCount,
          errorRate: `${metrics.application.errorRate.toFixed(2)}%`,
          avgResponseTime: `${metrics.application.responseTimeAvg.toFixed(2)}ms`
        },
        system: {
          memory: {
            free: `${Math.round(metrics.system.freeMemory / 1024 / 1024)} MB`,
            total: `${Math.round(metrics.system.totalMemory / 1024 / 1024)} MB`,
            usage: `${(100 - (metrics.system.freeMemory / metrics.system.totalMemory) * 100).toFixed(2)}%`
          },
          cpu: {
            load: metrics.system.loadAvg
          }
        }
      }
    }
  });
});

module.exports = {
  checkHealth
};
