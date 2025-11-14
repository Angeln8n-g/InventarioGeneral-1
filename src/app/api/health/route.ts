import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Health Check Endpoint
 * 
 * Este endpoint verifica el estado de la aplicación y sus dependencias.
 * Usado por Docker health checks y monitoreo.
 * 
 * @returns 200 OK si todo está saludable
 * @returns 503 Service Unavailable si hay problemas
 */
export async function GET() {
  try {
    const startTime = Date.now();
    
    // Verificar conexión a base de datos
    let dbStatus = 'unknown';
    let dbResponseTime = 0;
    
    try {
      const dbStartTime = Date.now();
      // Hacer una query simple para verificar conectividad
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      dbResponseTime = Date.now() - dbStartTime;
      
      if (error) {
        throw error;
      }
      
      dbStatus = 'healthy';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      dbStatus = 'unhealthy';
      
      // Si la base de datos no está disponible, retornar 503
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            database: {
              status: 'unhealthy',
              error: dbError instanceof Error ? dbError.message : 'Unknown database error'
            }
          }
        },
        { status: 503 }
      );
    }
    
    const totalResponseTime = Date.now() - startTime;
    
    // Todo está bien
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: {
            status: dbStatus,
            responseTime: `${dbResponseTime}ms`
          }
        },
        responseTime: `${totalResponseTime}ms`,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
