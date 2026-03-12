## 🔄 Actualización de Requisitos

### 🔐 Sistema de Contraseñas Personalizadas para Alumnos

**CAMBIO IMPORTANTE**: El PIN de 4 dígitos se mantiene solo para escáner/recuperación. Para el login del alumno:

1. **Contraseña por defecto**: Todos los alumnos nuevos tendrán \"Gymnastics2026\" como contraseña inicial
2. **Primer login**: El sistema debe mostrar un modal OBLIGATORIO para cambiar la contraseña
3. **No se puede omitir**: El alumno no accede al panel hasta cambiar su contraseña
4. **Actualización en Firestore**: La nueva contraseña se guarda en el campo `password` y se actualiza `requireCambioPassword: false`

### Campos a agregar en Firestore (colección "alumnos"):
```javascript
{
  // ... campos existentes ...
  password: \"Gymnastics2026\",           // Contraseña por defecto
  requireCambioPassword: true,          // Forzar cambio en primer login
  fechaUltimoCambioPassword: null       // Se llena después del cambio
}
```

### Flujo de autenticación:
1. Alumno ingresa: `IBI-GYM000001` (o CURP) + `Gymnastics2026`
2. Sistema detecta `requireCambioPassword === true`
3. Muestra modal de cambio de contraseña (no se puede cerrar)
4. Alumno crea su nueva contraseña (mínimo 8 caracteres)
5. Sistema actualiza Firestore
6. Alumno accede a su panel

### Usuarios del sistema:
- **Admin**: `admin@ibime.com` / `admin123` → Ve TODO
- **Recepción**: `recepcion@ibime.com` / `recep123` → Solo módulo recepción
- **Alumnos**: `IBI-GYM000001` (o CURP) + contraseña personalizada → Solo su panel

### Correcciones visuales del panel de alumno:
- Aplicar el mismo layout que funciona en el módulo de Recepción
- `margin-left: 260px` para respetar el sidebar
- Botones, tablas y formularios con el mismo estilo
- Sin elementos encimados

**Referencia de estructura existente**: El sistema ya genera IDs automáticamente (`IBI-GYM000001`) usando contador en `config/contador_alumnos` de Firestore.