# Feedback: decisiones

`@tankos/feedback` es el contrato neutral para mensajes globales de éxito,
información, advertencia y error, respaldado por Signals. El estado es
transitorio, en memoria y no es historial de dominio ni telemetría.

Las operaciones destructivas solicitan confirmación a través del contrato de
feedback; la UI devuelve la decisión y el caller ejecuta el comando. El adapter
Material está en `feedback-ui` y la aplicación monta un único outlet global.
Los textos y la localización los proporciona el host.
