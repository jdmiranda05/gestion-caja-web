package pe.edu.pe.gestion_caja_web.sale.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Total de ventas en caja de un dia: numero de tickets, unidades e ingresos.
 */
public record DailySales(LocalDate date, long tickets, long units, BigDecimal revenue) {
}
