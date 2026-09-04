# Panel de administración

Esta carpeta contiene la base de referencia para el módulo de administración del club.

## Objetivo

- Proteger la ruta del administrador con validación por rol.
- Conectar la vista a MySQL en tiempo real.
- Mostrar métricas, noticias, actividad reciente y acciones rápidas.

## Archivos

- `dashboard.sql`: consultas SQL reutilizables para las métricas del dashboard.

## Ruta de integración

El panel se integra en la ruta `/reportes` y se protege con un guard de Angular y un middleware del backend.

## Requisitos de seguridad

- Toda petición a `/api/admin/*` requiere un JWT válido.
- El backend valida que `req.usuario.rol === 'administrador'`.

## Credenciales de prueba

- Email: `admin@avellanedafc.com`
- Contraseña: `Admin1234!`
