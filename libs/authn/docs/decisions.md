# Authn: decisiones de autenticación

`@tankos/authn` define quién es la persona autenticada, no qué recursos puede
usar. `AccessContext` solo contiene identidad, roles generales y metadatos de
petición; no contiene Aquarium, Units ni claims de negocio.

La sesión debe soportar restauración tras recarga, login, logout y renovación
explícita de credenciales. Los roles son una ayuda de contexto y UX; nunca son
la única frontera de seguridad. Los adaptadores validan y normalizan sus claims
sin convertir claims arbitrarios en permisos.

Firebase, OAuth, OIDC y sus componentes de login son adaptadores separados. La
UI de Firebase vive en `authn-firebase-ui`; el núcleo no conoce Angular ni
Firebase.
