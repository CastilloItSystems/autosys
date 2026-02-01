# 🔧 Guía de Diagnóstico - Dashboard de Bahías

## Problema: "Endpoint no encontrado" (404)

Si ves el mensaje **"Endpoint no encontrado. Mostrando datos de prueba"**, significa que el frontend no puede encontrar los endpoints del backend.

## ✅ Pasos para Diagnosticar

### 1. Verificar que el backend esté corriendo

```bash
# El backend debería estar corriendo en:
# http://localhost:4000
# o
# https://app-taller-97d415ecb8bf.herokuapp.com
```

### 2. Usar el botón de Diagnóstico

En el dashboard de operaciones, encontrarás un botón morado **"Diagnóstico"** (ícono de corazón):

1. Click en el botón **"Diagnóstico"**
2. Abre la consola del navegador (F12)
3. Revisa los logs que empiezan con 🔍 🔗 ✅ ❌

### 3. Interpretar los resultados

El diagnóstico prueba estos endpoints:

- ✅ `/service-bays` - Lista de bahías
- ✅ `/dashboard/service-bays` - Dashboard con métricas
- ✅ `/work-orders` - Órdenes de trabajo

**Si ves ❌ (error 404):** El endpoint no existe en el backend
**Si ves ❌ (error 401):** Problema de autenticación
**Si ves ❌ (Network Error):** El servidor no está corriendo o no hay conexión

## 🔍 Logs en Consola

El dashboard ahora muestra logs detallados:

```
🔄 Cargando bahías desde API...
✅ Dashboard data: {...}
✅ All bays data: {...}
```

O en caso de error:

```
❌ Error loading bays: [error details]
📋 Error details: {
  message: "...",
  status: 404,
  url: "/dashboard/service-bays",
  baseURL: "https://app-taller-97d415ecb8bf.herokuapp.com/api"
}
```

## 🛠️ Soluciones Comunes

### Solución 1: Verificar URL del backend

Revisa el archivo `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

O si usas Heroku:

```env
NEXT_PUBLIC_API_BASE_URL=https://app-taller-97d415ecb8bf.herokuapp.com/api
```

### Solución 2: Verificar que el endpoint existe en el backend

Los endpoints deben estar implementados en el backend:

```
GET /api/service-bays
GET /api/dashboard/service-bays
POST /api/work-orders/:id/enter-bay
POST /api/work-orders/:id/exit-bay
```

### Solución 3: Verificar autenticación

Asegúrate de estar logueado y que tu token JWT sea válido.

### Solución 4: Usar datos mock temporalmente

El dashboard automáticamente usa datos de prueba si el backend no está disponible. Esto te permite:

- ✅ Continuar desarrollando el frontend
- ✅ Probar la interfaz visual
- ✅ Ver cómo funcionan los componentes

## 📊 Datos Mock vs Datos Reales

### Modo Mock (actual)

- 12 bahías generadas aleatoriamente
- Datos consistentes pero ficticios
- Toast amarillo: "Endpoint no encontrado"

### Modo Real (cuando el backend esté disponible)

- Datos reales del backend
- Métricas precisas
- Toast verde: "X bahías cargadas"

## 🚀 Próximos Pasos

Una vez que el backend tenga los endpoints implementados:

1. El dashboard automáticamente se conectará
2. Los datos mock desaparecerán
3. Verás información real del taller

## 💡 Notas

- El botón de **"Diagnóstico"** es temporal para debugging
- Puedes removerlo una vez que todo funcione
- Los logs en consola ayudan a identificar problemas rápidamente

---

**Última actualización:** Noviembre 2025
