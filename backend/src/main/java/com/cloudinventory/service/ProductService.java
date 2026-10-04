package com.cloudinventory.service;

import com.cloudinventory.model.Product;
import com.cloudinventory.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product updatedProduct) {

        Product existing = productRepository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setName(updatedProduct.getName());
        existing.setSku(updatedProduct.getSku());
        existing.setCategory(updatedProduct.getCategory());
        existing.setPrice(updatedProduct.getPrice());
        existing.setStock(updatedProduct.getStock());

        return productRepository.save(existing);
    }

    public boolean deleteProduct(Long id) {

        if (!productRepository.existsById(id)) {
            return false;
        }

        productRepository.deleteById(id);
        return true;
    }
}