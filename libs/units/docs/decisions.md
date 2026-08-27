# Units: decisiones de dominio

Este documento es la fuente de verdad de las decisiones específicas de
`@tankos/units`. Las decisiones generales del producto y las de verticales aún
no implementadas permanecen en `.codex/archive/`.

## Alcance

Units modela definiciones de unidades y sus conversiones. No modela
mediciones, parámetros, acuarios ni observaciones. Una medición futura podrá
referenciar un código de unidad, pero la relación no invierte la dependencia.

## Definiciones

- Una unidad tiene identidad estable, código cualificado, sistema y metadatos
  de representación.
- Las unidades son públicas o privadas; no existe un catálogo en memoria
  paralelo.
- Una unidad privada tiene propietario. El keeper puede usar y administrar sus
  privadas, pero solo puede leer las públicas. El admin puede administrar
  ambos ámbitos y promover una privada a pública.
- El código es un identificador de negocio y no se edita al modificar una
  unidad. La aplicación conserva la identidad y el adaptador impone la
  unicidad lógica.
- Las revisiones se almacenan como nuevos registros cuando cambia el contrato;
  el ciclo de vida técnico pertenece a `data-access`.

## Representación y conversiones

Una representación conserva símbolo, fallback ASCII, posición y espaciado. El
formateo textual pertenece a la presentación; el dominio solo conserva los
metadatos necesarios para producirlo.

Las conversiones son primitivas inmutables y se ejecutan mediante un puerto
reemplazable. La definición de unidades no conoce Angular, Firebase, Firestore,
Zod ni un proveedor de traducciones.

## Límites

No se aceptan números sin unidad ni relaciones con Aquarium. La compatibilidad
entre una unidad y una futura medición será decisión de la vertical de
mediciones, no de Units.
