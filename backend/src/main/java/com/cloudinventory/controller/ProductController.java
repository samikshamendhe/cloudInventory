package com.cloudinventory.controller;

import com.cloudinventory.model.Product;
import com.cloudinventory.service.ProductService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:3000"
})
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> getProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {

        Product product = productService.getProductById(id);

        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(product);
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestBody Product product) {

        return ResponseEntity.ok(
                productService.createProduct(product)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestBody Product product) {

        Product updated =
                productService.updateProduct(id, product);

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(
            @PathVariable Long id) {

        boolean deleted =
                productService.deleteProduct(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                "Product deleted successfully"
        );
    }
}