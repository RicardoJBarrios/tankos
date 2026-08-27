# Error handling: decisiones

El contrato común distingue errores de dominio, validación, infraestructura,
permiso, offline e inesperados. Cada librería puede publicar normalizadores de
los errores que conoce; la composition root los ordena y conecta con feedback,
logging y telemetría.

El mensaje mostrado al usuario es seguro y desacoplado del detalle técnico. No
se exponen causas de Firebase, rutas internas, tokens, credenciales ni
payloads. Las causas sanitizadas son exclusivamente diagnósticas.

La librería centraliza la clasificación, no decide el texto localizado ni el
proveedor de observabilidad. Un error no normalizado recibe un fallback seguro
y se reporta como inesperado.
