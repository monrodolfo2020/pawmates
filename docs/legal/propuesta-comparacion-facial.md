# Propuesta: comparación automática de rostros en la verificación de identidad

**Estado:** los cambios de abajo ya se aplicaron en el Aviso de Privacidad 1.1, el
consentimiento de verificación 1.1 y el Acuerdo de Prestadores 1.1 (cláusula 9). Siguen
siendo borradores que debe revisar el abogado. La función sigue apagada
(`FACE_MATCH_ENABLED` sin configurar) hasta completar los pasos del final.

## Qué hace la función

Cuando un negocio envía su foto de rostro y la de su identificación, PawMates las manda a
Amazon Rekognition (Amazon Web Services), que calcula qué tanto se parecen los dos
rostros (0 a 100 %). El resultado se muestra **solo al administrador**, como ayuda para
revisar. **La decisión sigue siendo de una persona**; nada se aprueba ni se rechaza de
forma automática. Las fotos se siguen borrando al decidir; el porcentaje se conserva junto
con el resultado como constancia de cómo se decidió.

## Cambios propuestos al Aviso de Privacidad

### Sección 4.2, inciso d) — reemplazar por:

> d) las usamos **exclusivamente** para verificar que la persona de la fotografía
> corresponde a la del documento. Para ello, un sistema automatizado de nuestro proveedor
> Amazon Web Services compara los dos rostros y calcula su grado de parecido; ese
> resultado **solo ayuda** a la persona de nuestro equipo que revisa, quien toma la
> decisión. **Ninguna verificación se aprueba ni se rechaza de forma automática.** No
> publicamos las imágenes, no creamos con ellas plantillas ni bases de datos de rostros,
> no las usamos para identificarte en ningún otro contexto, no las comercializamos y no
> las compartimos con otros usuarios; y

### Sección 4.2, inciso e) — agregar al final:

> Conservamos también el grado de parecido que calculó el sistema, como constancia de
> cómo se tomó la decisión; no es una imagen ni permite reconstruir tu rostro.

### Sección 6.1 (proveedores) — agregar a la tabla:

| Proveedor | Para qué | Dónde |
|---|---|---|
| Amazon Web Services (Amazon Rekognition) | Comparación automática de la fotografía de tu rostro con la de tu documento, solo durante la verificación de identidad | Estados Unidos |

## Cambios propuestos al consentimiento de verificación

Reemplazar el texto por:

> La verificación de identidad es **opcional**. Si decides continuar, nos entregas una
> fotografía de tu rostro y una de tu documento oficial de identificación. Un sistema
> automatizado de nuestro proveedor Amazon Web Services comparará los dos rostros y una
> persona de nuestro equipo revisará las fotografías para confirmar que corresponden a la
> misma persona; **la decisión la toma esa persona, no el sistema.** No las publicamos, no
> las usamos para identificarte en otro contexto y no las compartimos con otros usuarios.
> Las borramos en cuanto se resuelve la verificación. Puedes retirarlas cuando quieras
> escribiendo a **rmonterrozag@gmail.com**.
>
> `[ ]` **Consiento expresamente** el tratamiento de estas dos imágenes, incluida su
> comparación automatizada, para la finalidad descrita, en los términos de la sección 4 del
> Aviso de Privacidad.

## Notas para el abogado

1. **Dato biométrico.** Comparar rostros con un sistema automatizado es tratamiento de
   datos biométricos, que la ley considera datos personales sensibles. ¿Basta el
   consentimiento expreso con casilla separada que ya se usa, o debe ser por escrito con
   firma, electrónica o autógrafa?
2. **Encargado en el extranjero.** Amazon trata las imágenes por cuenta de PawMates
   (remisión) en Estados Unidos. Confirmar que la redacción de la sección 6 es suficiente
   con la ley vigente.
3. **Uso de las imágenes por el proveedor.** Por defecto, algunos servicios de IA de AWS
   pueden conservar contenido para mejorar el servicio. Antes de encender la función hay que
   desactivarlo en la cuenta de AWS, con la *política de exclusión de servicios de IA* de
   AWS Organizations. Así el Aviso puede decir con verdad que las imágenes no se usan para
   nada más.
4. **Decisión humana.** El diseño evita decisiones automatizadas con efectos sobre la
   persona: el sistema solo sugiere. Confirmar que no hace falta informar un derecho
   adicional de revisión humana.

## Cómo se publica cuando esté aprobado

1. ~~Actualizar el Aviso y el consentimiento~~ (hecho, versión 1.1).
2. ~~Subir sus versiones~~ (hecho: todos vuelven a aceptarlos al entrar).
3. Revisión del abogado; si pide cambios, se aplican y se sube otra vez la versión.
4. En la cuenta de AWS, activar la política de exclusión de servicios de IA.
5. En Vercel, en el backend: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
   (por ejemplo `us-east-1`) y, al final, `FACE_MATCH_ENABLED=true`. Luego, Redeploy.
