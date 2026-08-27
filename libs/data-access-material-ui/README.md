# @tankos/data-access-material-ui

Renderizador Material para el contrato genérico de listados CRUD. Proporciona
tabla, selección, acciones y paginación para Angular Material.

## Responsabilidades

- Presentar `CrudRecord<T>` mediante una tabla Material.
- Emitir eventos semánticos de detalle, edición, lifecycle, publicación y
  paginación sin ejecutar casos de uso.
- Obtener las etiquetas desde `CRUD_UI_LABELS`.

## Límites y arquitectura

Es un adaptador visual, no una librería de dominio ni de persistencia. El
contrato headless vive en `@tankos/data-access-ui`; esta librería añade la
dependencia opcional de Angular Material.
