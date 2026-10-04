package com.cloudinventory.controller;

import com.cloudinventory.model.CustomerOrder;
import com.cloudinventory.service.OrderService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<CustomerOrder> getOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerOrder> getOrder(
            @PathVariable Long id) {

        CustomerOrder order =
                orderService.getOrderById(id);

        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(order);
    }

    @PostMapping
    public ResponseEntity<CustomerOrder> createOrder(
            @RequestBody CustomerOrder order) {

        return ResponseEntity.ok(
                orderService.createOrder(order)
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<CustomerOrder> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        CustomerOrder updated =
                orderService.updateStatus(
                        id,
                        request.get("status")
                );

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }
}