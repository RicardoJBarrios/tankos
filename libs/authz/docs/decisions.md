# Authz: decisiones de autorización

`@tankos/authz` es un lenguaje ABAC provider-neutral. Transporta sujeto,
recurso, acción y atributos; cada dominio interpreta sus propios atributos.

La evaluación es restrictiva por defecto: solo una política explícita concede
acceso y un error o ausencia de decisión no concede permisos. `keeper` y
`admin` son roles generales, no un catálogo de permisos. Memberships, ownership,
visibility, lifecycle y grants pertenecen al dominio del recurso.

Los guards de Angular son una ayuda de navegación. La autorización real debe
repetirse en el adaptador/política de aplicación y en las reglas del proveedor.
`authz-firestore` persiste hechos de autorización; no sustituye la evaluación
ni introduce conocimiento de Aquarium o Units.
