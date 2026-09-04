/**
 * ============================================================
 * MIDDLEWARE/AUTH.JS — Middleware de Verificación JWT
 * ============================================================
 * Un "middleware" en Express es una función que se ejecuta
 * ANTES de que la petición llegue al handler final.
 *
 * Este middleware protege rutas que requieren autenticación.
 * Se usa así en los routers:
 *   router.use(auth);               → protege TODAS las rutas del router
 *   router.get('/datos', auth, fn); → protege UNA ruta específica
 *
 * FUNCIONAMIENTO:
 *   1. Lee el header "Authorization: Bearer <token>"
 *   2. Verifica que el token sea válido usando la clave secreta JWT
 *   3. Si es válido: decodifica el payload y lo guarda en req.usuario
 *      para que los handlers siguientes puedan acceder al usuario logueado
 *   4. Si no es válido: responde 401 y corta la cadena (no llama a next())
 *
 * El payload decodificado en req.usuario tiene la forma:
 *   { id, email, rol, nombre }
 * ============================================================
 */
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const header = req.headers['authorization'];

  // Verificar que venga el header con formato correcto
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido.' });
  }

  const token = header.split(' ')[1]; // Extraer solo el token, sin el prefijo "Bearer "

  try {
    /**
     * jwt.verify() comprueba:
     *   1. Que la firma sea válida (no fue modificado)
     *   2. Que no haya expirado (campo 'exp' del payload)
     * Si falla cualquiera, lanza una excepción y se ejecuta el catch.
     */
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next(); // Token válido → continúa al handler de la ruta
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = authMiddleware;
