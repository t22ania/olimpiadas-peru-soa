/**
 * Configuración de Jest para un proyecto con módulos ES ("type": "module").
 * No se define ningún transform: los archivos .js se cargan de forma nativa
 * gracias a la bandera --experimental-vm-modules declarada en el script "test".
 */
export default {
  testEnvironment: 'node',
  // Declarado de forma explícita: en Jest 30 el detalle por prueba (PASS y ✓)
  // no se imprime si 'reporters' se deja implícito.
  reporters: ['default'],
  coverageProvider: 'v8',
  collectCoverage: true,
  coverageReporters: ['text', 'html', 'lcov'],
  collectCoverageFrom: [
    'src/config/**/*.js',
    'src/services/**/*.js',
    'src/routes/**/*.js'
  ],
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.js'],
  // Las pruebas de integración abren conexiones reales a PostgreSQL.
  testTimeout: 30000,
  verbose: true
}
