# runtime\_ — tienda de scripts

Tienda en Next.js con multi-idioma (ES/EN), panel de administración y pago
por **transferencia bancaria con confirmación manual**, más **PayPal** como
alternativa.

> **Por qué transferencia y no tarjetas:** Ecuador no está en la lista de
> países soportados por Stripe, así que no se puede abrir una cuenta ni
> cobrar tarjetas/Google Pay desde aquí. Mercado Pago sí opera en Ecuador,
> pero su Checkout API no lista el país entre los disponibles. La
> transferencia bancaria es lo que compra la gente localmente, sin
> comisiones ni retenciones de 21-180 días.

---

## 1. Requisitos

- Node 20 o superior
- Un proyecto de [Supabase](https://supabase.com) (ya tienes uno)
- Una cuenta bancaria tuya para recibir las transferencias
- Opcional: una cuenta de [PayPal](https://developer.paypal.com) de **Empresas** (personal no sirve para la API)

## 2. Instalación

```bash
npm install
```

## 3. Base de datos

Abre el **SQL Editor** de tu proyecto en Supabase y ejecuta el archivo
[`supabase/schema.sql`](./supabase/schema.sql).

> **Lee esto antes de ejecutar.** El SQL crea las tablas asumiendo que
> aún no existen. Si tu base ya tiene tablas `scripts` u `orders`,
> NO lo ejecutes tal cual: el script usa `create table if not exists`,
> así que dejaría pasar las tablas existentes y las columnas nuevas
> nunca se agregarían. En ese caso, pásame las columnas de tus tablas
> y adapto el esquema.

Después, en el mismo editor:

```sql
-- Convierte tu cuenta en administradora.
-- Hazlo DESPUÉS de haber iniciado sesión una vez, para que exista tu perfil.
update public.profiles set is_admin = true where email = 'tu@email.com';
```

### Bucket de archivos

En **Storage → New bucket**:

| Campo | Valor |
|---|---|
| Name | `scripts` |
| Public bucket | **DESACTIVADO** |
| File size limit | 25 MB |

El bucket **debe ser privado**. Con "public bucket" activado, cualquiera
que conozca la ruta puede descargar los scripts sin pagar. Si ya lo creaste
público:

```sql
update storage.buckets set public = false where name = 'scripts';
```

**No añadas policies de lectura para el rol `anon`.** El servicio de pagos
usa la service role, que salta RLS, así que ya tiene acceso.

### Publicar un script (en orden)

1. `/es/admin` → **Scripts** → *Nuevo script*. Rellena nombre, slug,
   extensión, precio y descripciones.
2. Al guardar, el panel te lleva a la pantalla de edición.
3. Ahí sube el archivo (`.py`, `.sh`, `.js`, …, máx. 25 MB). La ruta se
   guarda sola en `file_path`.
4. Cambia el estado a **publicado**.

El paso 3 no es opcional: el checkout descarta los scripts sin `file_path`,
porque no se puede entregar lo que no está subido. El listado marca
*"sin archivo — no se podrá vender"* para que lo detectes de un vistazo.

## 4. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena los valores. Los de Supabase están en
**Project Settings → API**. Los de PayPal en **developer.paypal.com → Apps & Credentials** (necesitas cuenta de Empresas).
Los de PayPal en **Dashboard → Apps & Credentials**.

| Variable | Para qué sirve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (segura para el navegador) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor. **Nunca** la expongas |
| `NEXT_PUBLIC_SITE_URL` | URLs de retorno tras el pago |
| `SCRIPTS_BUCKET` | Bucket con los scripts (por defecto `scripts`) |
| `RECEIPTS_BUCKET` | Bucket con los comprobantes (por defecto `receipts`) |
| `BANK_NAME` | Nombre del banco que se muestra al comprador |
| `BANK_ACCOUNT_TYPE` | "Corriente" / "Ahorros" |
| `BANK_ACCOUNT_NUMBER` | Número de cuenta. **Sin esto no puedes vender** |
| `BANK_ACCOUNT_HOLDER` | Titular de la cuenta |
| `BANK_WHATSAPP` | Opcional, se muestra como contacto |
| `BANK_EMAIL` | Opcional |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Solo si activas PayPal (requiere cuenta de Empresas) |
| `PAYPAL_SECRET` | Solo si activas PayPal |

## 5b. Cobro por transferencia: cómo funciona

```
Comprador                Tu panel                Comprador
    |                       |                        |
    | mete al carrito      |                        |
    | paga por transferencia|                       |
    | y sube el comprobante|                       |
    |--> /api/transferencia|                        |
    |    (orden 'pendiente')|                       |
    |                       |                        |
    |  ve datos bancarios  |                        |
    |  y su número de orden|                        |
    |                       |                        |
    |  transfiere por su banco                       |
    |                       |                        |
    |                       |<-- ves la orden pendiente
    |                       |    en /admin/ventas
    |                       |                        |
    |                       |-- "ver comprobante" --> (abres el PDF/imagen)
    |                       |                        |
    |                       |-- "confirmar pago" --->  se emiten los tokens
    |                       |                        |
    |                       |                        | va a /descargas
    |                       |                        | con su correo y descarga
```

El comprador **no** recibe la descarga al instante: la orden nace en
`pendiente` hasta que tú confirmas. Ese es el punto. Si se liberara
automáticamente, cualquiera podría subir un comprobante falso y
descargar gratis.

Mientras esperas, la orden aparece en `/es/admin/ventas` con el botón
*ver comprobante* y *confirmar pago*.

El comprador no hace nada: deja abierta la página de su orden, que
pregunta el estado cada 15 segundos. En cuanto confirmas, los enlaces
aparecen ahí mismo. La ruta `/descargas` (por email) queda solo como
respaldo si pierde la URL.

## 6. Bucket de comprobantes

En **Storage**, crea un segundo bucket privado llamado `receipts`
(mismo criterio: *Public bucket* **DESACTIVADO**, 10 MB).

Va separado del de los scripts a propósito: los comprobantes son
**documentos bancarios personales** del comprador, no productos. No
deben mezclarse ni quedar accesibles por error.

## 7. Arrancar

```bash
npm run dev
```

- Web: <http://localhost:3000> (redirige a `/es`)
- Panel: `/es/admin` (solo administradores)

## 8. Cómo se conecta todo

```
Comprador                Servidor (Next.js)              Supabase
    |                          |                            |
    |-- mete al carrito ------>|                            |
    |   (localStorage)         |                            |
    |                          |                            |
    |  (A) transferencia:      |                            |
    |-- /api/transferencia --->|                            |
    |    + comprobante         |-- precios desde ----------->|
    |                          |<-- precio real -------------|
    |                          |-- orden 'pendiente' ------>|
    |                          |-- guarda comprobante ----->|
    |<-- datos bancarios -----|  (bucket "receipts")        |
    |  + URL de su orden       |                            |
    |                                                       |
    |   transfiere por su banco                            |
    |                                                       |
    |  la página consulta el estado cada 15s               |
    |  (/api/transferencia/<id>/status)                    |
    |                                                       |
    |                       ADMIN: /es/admin/ventas         |
    |                          |-- ve la orden pendiente ->|
    |                          |-- abre el comprobante ---->|
    |                          |-- "confirmar" ------------>|
    |                          |   marca pagado + tokens   |
    |                                                       |
    |<-- los enlaces aparecen|                            |
    |    solos en la página  |                            |
    |-- /api/download/<token>->|  valida token, sirve archivo|
```

**El cliente no tiene que hacer nada más.** Se queda en la URL de su
orden, transfiere, y en cuanto confirmas los enlaces aparecen solos.
No hay correo intermedio ni escribir su email otra vez.

## 9. Decisiones de seguridad (léelas)

**Los precios nunca se aceptan desde el navegador.** Tanto
`/api/transferencia` como `/api/paypal/create-order` ignoran lo que el
cliente envíe y consultan el precio real en la tabla `scripts`. Si se
tomara el precio del cliente, bastaría un `priceCents: 1` para comprar
todo por un centavo.

**Una transferencia NO libera la descarga automáticamente.** La orden
nace en `pendiente` y solo tú la pasas a `pagado` desde el panel. Si se
liberara sola, bastaría subir una imagen cualquiera como "comprobante"
para descargar gratis.

**El `orderId` funciona como credencial de la URL.** Es un UUID v4, no
adivinable, y solo lo tiene quien compró (va en su URL). Por eso
`/api/transferencia/<id>/status` puede devolverle los enlaces sin
pedirle el email otra vez. Los tokens de descarga siguen siendo de un
solo uso, así que esto no abre ningún enlace extra: quien no tenga el
UUID simplemente no llega. `/descargas` por email queda como respaldo.

**No se confirma sin comprobante.** `PATCH /api/admin/orders/<id>`
rechaza la acción si la orden no tiene un comprobante adjunto, para que
no se te escape confirmar un pedido vacío.

**El comprobante solo lo ve el admin.** La tabla `transfer_receipts` no
tiene policies de lectura y se sirve con la service role. Contiene datos
bancarios del comprador, así que no se expone al `anon`.

**Los comprobantes se validan por tipo y tamaño.** Solo imágenes JPEG,
PNG, WebP o PDF, hasta 10 MB. El bucket `receipts` es privado y distinto
del de los scripts.

**El panel se valida en el servidor, dos veces.** El layout de `/admin`
llama a `isAdmin()` antes de renderizar, y cada Route Handler vuelve a
llamar a `requireAdmin()`. La UI no es una frontera de seguridad.

**Los tokens de descarga son de un solo uso y caducan a los 7 días.** Se
marcan como usados *antes* de entregar el archivo. Si el cliente cancela
la descarga a medias, pierde el enlace y hay que pedir otro: es
preferible a regalar enlaces ilimitados.

**La confirmación es idempotente.** `markOrderPaidAndIssueTokens`
filtra por `status = 'pendiente'`, así que pulsar "confirmar" dos veces no
genera tokens duplicados: la segunda llamada no afecta ninguna fila.

**`download_tokens` no tiene policy de lectura.** Los tokens se consultan
solo desde el servidor con la service role. Por eso
`/api/my-downloads` exige el email completo de la compra.

**Nadie puede autoelevarse a admin.** La tabla `profiles` no tiene policy
de UPDATE general. El usuario autenticado solo puede editar la columna
`full_name`:

```sql
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
```

Sin esto, `update { is_admin: true }` sobre la propia fila convierte a
cualquier visitante en administrador. Para promover a alguien, hazlo desde
el SQL Editor:

```sql
update public.profiles set is_admin = true where email = 'quien@email.com';
```

**La subida de archivos valida extensión y tamaño.** `/api/admin/upload`
acepta solo una lista de formatos (`.py`, `.sh`, `.js`, `.ts`, …) y
rechaza archivos de más de 25 MB. La clave del objeto en Storage se
construye con el `slug` del script, nunca con el nombre de archivo que
envía el usuario, así que un `../` en el nombre no escapa del directorio.

**`/api/my-downloads` permite enumerar pedidos por email.** Es un
endpoint público, así que sabe cuántos pedidos tiene una dirección
concreta. En la venta por transferencia esto importa más: el email es la
única llave, y cualquiera puede ver el estado de pedidos ajenos mientras
espera confirmación. Si te preocupa, la solución es un enlace mágico por
correo o pedir el número de orden además del email.

**Ordenar la cola de confirmaciones.** La tabla tiene índice por
`status`, así que filtrar las pendientes es rápido. Si acumulas muchas,
agrupa por día y confirma en lote: el flujo es abrir el comprobante,
comparar monto y referencia, y confirmar.

## 10. Desplegar en Vercel

```bash
npm i -g vercel
vercel
```

Configura las mismas variables de entorno en el dashboard de Vercel.
`NEXT_PUBLIC_SITE_URL` debe apuntar al dominio real, porque las
redirecciones de PayPal lo usan.

---

## Estructura

```
src/
├── app/
│   ├── [locale]/          # páginas públicas + panel admin
│   │   ├── page.tsx       # home
│   │   ├── scripts/[slug] # detalle
│   │   ├── descargas/     # recuperación de enlaces
│   │   ├── transferencia/[orderId]  # instrucciones + datos bancarios
│   │   ├── gracias-paypal/# retorno de PayPal
│   │   ├── login/
│   │   └── admin/         # dashboard, ventas, scripts, publicaciones, clientes
│   └── api/
│       ├── transferencia/ # crea la orden + sube el comprobante
│       ├── paypal/        # create-order, capture
│       ├── paypal/        # create-order, capture
│       ├── download/[token]/
│       ├── my-downloads/
│       ├── subscribe/
│       └── admin/         # escritura protegida por requireAdmin
│           ├── upload/    # sube el archivo al bucket privado
│           ├── scripts/
│           └── publications/
├── components/
├── i18n/                  # config + diccionario ES/EN
├── lib/                   # supabase, stripe, paypal, auth, orders, cart
└── middleware.ts          # redirección por idioma + refresh de sesión
```
