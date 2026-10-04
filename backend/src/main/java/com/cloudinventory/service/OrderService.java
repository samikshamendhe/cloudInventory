package com.cloudinventory.service;

import com.cloudinventory.model.CustomerOrder;
import com.cloudinventory.model.Product;
import com.cloudinventory.repository.OrderRepository;
import com.cloudinventory.repository.ProductRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    public List<CustomerOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    public CustomerOrder getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public CustomerOrder createOrder(CustomerOrder order) {

        Product product = productRepository
                .findById(order.getProductId())
                .orElse(null);

        if (product == null) {
            throw new RuntimeException("Product not found");
        }

        if (product.getStock() < order.getQuantity()) {
            throw new RuntimeException("Insufficient stock");
        }

        double totalAmount =
                product.getPrice() * order.getQuantity();

        order.setAmount(totalAmount);

        if (order.getStatus() == null ||
                order.getStatus().isBlank()) {
            order.setStatus("Pending");
        }

        product.setStock(
                product.getStock() - order.getQuantity()
        );

        productRepository.save(product);

        return orderRepository.save(order);
    }

    public CustomerOrder updateStatus(Long id, String status) {

        CustomerOrder order = getOrderById(id);

        if (order == null) {
            return null;
        }

        order.setStatus(status);

        return orderRepository.save(order);
    }
}