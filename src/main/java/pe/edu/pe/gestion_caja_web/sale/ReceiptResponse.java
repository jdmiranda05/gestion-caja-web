package pe.edu.pe.gestion_caja_web.sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReceiptResponse {

    private String receiptNumber;
    private LocalDateTime issueDate;
    private String productName;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal total;

    public ReceiptResponse() {
    }

    public ReceiptResponse(String receiptNumber, LocalDateTime issueDate, String productName, 
                           int quantity, BigDecimal unitPrice, BigDecimal total) {
        this.receiptNumber = receiptNumber;
        this.issueDate = issueDate;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.total = total;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public LocalDateTime getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDateTime issueDate) {
        this.issueDate = issueDate;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}