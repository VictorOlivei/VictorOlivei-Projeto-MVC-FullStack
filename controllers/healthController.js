/**
 * Controlador de saúde da aplicação
 * Implementa endpoint para monitoramento básico do sistema
 */
const { catchAsync } = require('../middlewares/errorHandler');
const { getMetrics } = require('../middlewares/monitoringMiddleware');
const logger = require('../utils/logger');

// Controlador para verificar a saúde da aplicação
const checkHealth = catchAsync(async (req, res, next) => {
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
  
  // Registrar verificação de saúde
  logger.info({
    type: 'health_check',
    status: overallStatus,
    components
  });
  
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
