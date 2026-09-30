const requireEntrenador = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ message: 'Token requerido.' });
  }

  if (req.usuario.rol !== 'entrenador') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de entrenador.' });
  }

  next();
};

module.exports = requireEntrenador;