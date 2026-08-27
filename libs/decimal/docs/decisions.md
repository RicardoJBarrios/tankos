# Decimal: decisiones numéricas

`@tankos/decimal` representa valores decimales exactos para dominios que no
pueden depender de `number` binario. Define validación, comparación,
aritmética, precisión y redondeo, pero no define unidades, conversiones,
mediciones, dinero ni formato localizado.

Big.js y Zod son adaptadores físicos separados (`decimal-big-js` y
`decimal-zod`). El dominio consumidor decide la precisión y redondeo de cada
concepto; no existe una regla global implícita.
