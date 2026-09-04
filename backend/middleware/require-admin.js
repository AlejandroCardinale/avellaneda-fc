/**
 * Middleware de seguridad: solo permite acceso a usuarios administradores.
 */
const requireAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ message: 'Token requerido.' });
  }

  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }

  next();
};

module.exports = requireAdmin;
