package com.cloudinventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private Long productId;
    private int quantity;
    private double amount;
    private String status;

    public CustomerOrder() {
    }

    public CustomerOrder(
            String customerName,
            Long productId,
            int quantity,
            double amount,
            String status) {

        this.customerName = customerName;
        this.productId = productId;
        this.quantity = quantity;
        this.amount = amount;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}