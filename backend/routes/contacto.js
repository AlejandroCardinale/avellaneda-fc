/**
 * ============================================================
 * ROUTES/CONTACTO.JS — Endpoint del formulario de contacto
 * ============================================================
 * POST /api/contacto
 *   1. Guarda el mensaje en la tabla 'contactos' de la BD
 *   2. Envía un email de notificación a CONTACT_EMAIL (.env)
 *   3. Envía un email de confirmación al remitente
 * ============================================================
 */
const express      = require('express');
const nodemailer   = require('nodemailer');
const pool         = require('../db');
const router       = express.Router();

// Transporter reutilizando la configuración SMTP del .env
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  requireTLS: true,   // Necesario para Outlook/Hotmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { ciphers: 'SSLv3' }
});

// ─── POST /api/contacto ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nombre, email, telefono, asunto, mensaje } = req.body;

  // Validaciones básicas
  if (!nombre || !email || !asunto || !mensaje) {
    return res.status(400).json({ message: 'Nombre, email, asunto y mensaje son obligatorios.' });
  }
  if (mensaje.length < 10) {
    return res.status(400).json({ message: 'El mensaje debe tener al menos 10 caracteres.' });
  }

  try {
    // 1. Guardar en la base de datos
    await pool.execute(
      `INSERT INTO contactos (nombre, email, asunto, mensaje)
       VALUES (?, ?, ?, ?)`,
      [nombre.trim(), email.toLowerCase().trim(), asunto, mensaje.trim()]
    );

    const destinatario = process.env.CONTACT_EMAIL;
    const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    // 2. Email de notificación al administrador
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      destinatario,
      subject: `[Avellaneda FC] Nueva consulta: ${asunto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0d1b3e; font-size: 22px; margin: 0;">📬 Nueva consulta recibida</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Avellaneda FC — Formulario de Contacto</p>
          </div>
          <div style="background: white; border-radius: 10px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 110px;">Nombre</td>
                <td style="padding: 10px 0; color: #1e293b;">${nombre}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Email</td>
                <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #1e4fd8;">${email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Teléfono</td>
                <td style="padding: 10px 0; color: #1e293b;">${telefono || '—'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Asunto</td>
                <td style="padding: 10px 0; color: #1e293b;"><strong>${asunto}</strong></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-weight: 600; vertical-align: top;">Mensaje</td>
                <td style="padding: 10px 0; color: #1e293b; line-height: 1.6;">${mensaje.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Recibido el ${ahora}</p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(asunto)}"
               style="background: #1e4fd8; color: white; padding: 12px 28px; border-radius: 8px;
                      text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
              Responder al usuario
            </a>
          </div>
        </div>
      `
    });

    // 3. Email de confirmación al usuario
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      email,
      subject: 'Recibimos tu consulta — Avellaneda FC',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0d1b3e; font-size: 22px; margin: 0;">Avellaneda FC</h1>
          </div>
          <div style="background: white; border-radius: 10px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
            <h2 style="color: #0d1b3e; font-size: 18px; margin-top: 0;">¡Gracias por escribirnos, ${nombre}!</h2>
            <p style="color: #475569; line-height: 1.7;">
              Recibimos tu mensaje sobre <strong>"${asunto}"</strong> y te responderemos
              en un plazo de <strong>24 horas hábiles</strong>.
            </p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #475569;">
              <strong>Tu mensaje:</strong><br><br>
              ${mensaje.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
              Si tu consulta es urgente, también podés comunicarte al<br>
              <strong>+54 11 1234 5678</strong> en horario de atención (Lun–Vie 9:00 a 18:00 hs).
            </p>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
            Avellaneda FC — Av. Siempre Viva 123, Avellaneda, Buenos Aires
          </p>
        </div>
      `
    });

    return res.status(201).json({ message: '¡Mensaje enviado! Te responderemos a la brevedad.' });

  } catch (err) {
    console.error('[contacto]', err);
    return res.status(500).json({ message: 'Error al enviar el mensaje. Intentá más tarde.' });
  }
});

module.exports = router;
