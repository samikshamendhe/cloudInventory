package com.cloudinventory.controller;

import com.cloudinventory.model.Product;
import com.cloudinventory.repository.ProductRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
public class InventoryController {

    private final ProductRepository productRepository;

    public InventoryController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getInventory() {
        return productRepository.findAll();
    }

    @GetMapping("/low-stock")
    public List<Product> getLowStock() {
        return productRepository.findAll()
                .stream()
                .filter(product -> product.getStock() <= 5)
                .toList();
    }
}