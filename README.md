# Gestion Caja Web

Primer avance de una bodega con inventario y caja usando Spring Boot.

## Incluye

- Catálogo de productos con nombre, categoría, precio y stock.
- Registro de ventas y descuento automático del inventario.
- Vista web para la persona encargada de la bodega.
- Catálogo visible para clientes.
- Persistencia local con H2 en `data/gestion-caja`.
- API REST en `/api/products` y `/api/sales`.

## Ejecutar

```text
./mvnw spring-boot:run
```

Luego abrir `http://localhost:8080`.

La consola H2 está disponible en `http://localhost:8080/h2-console` para revisar la base durante el desarrollo.
