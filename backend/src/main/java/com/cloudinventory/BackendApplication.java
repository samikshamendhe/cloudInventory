package com.cloudinventory;

import com.cloudinventory.model.CustomerOrder;
import com.cloudinventory.model.Product;
import com.cloudinventory.repository.OrderRepository;
import com.cloudinventory.repository.ProductRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(
                BackendApplication.class,
                args
        );
    }

    @Bean
    CommandLineRunner loadData(
            ProductRepository productRepository,
            OrderRepository orderRepository) {

        return args -> {

            if (productRepository.count() == 0) {

                productRepository.save(
                        new Product(
                                "MacBook Air M5",
                                "LAP-001",
                                "Laptops",
                                119999,
                                18
                        )
                );

                productRepository.save(
                        new Product(
                                "Mechanical Keyboard",
                                "KEY-014",
                                "Accessories",
                                7499,
                                5
                        )
                );

                productRepository.save(
                        new Product(
                                "4K Monitor",
                                "MON-027",
                                "Displays",
                                28999,
                                2
                        )
                );

                productRepository.save(
                        new Product(
                                "Wireless Mouse",
                                "MOU-032",
                                "Accessories",
                                2499,
                                46
                        )
                );
            }

            if (orderRepository.count() == 0) {

                orderRepository.save(
                        new CustomerOrder(
                                "Rahul Sharma",
                                1L,
                                1,
                                119999,
                                "Pending"
                        )
                );

                orderRepository.save(
                        new CustomerOrder(
                                "Ananya Mehta",
                                4L,
                                2,
                                4998,
                                "Shipped"
                        )
                );

                orderRepository.save(
                        new CustomerOrder(
                                "Rohan Patil",
                                3L,
                                1,
                                28999,
                                "Delivered"
                        )
                );

                orderRepository.save(
                        new CustomerOrder(
                                "Sneha Joshi",
                                2L,
                                1,
                                7499,
                                "Processing"
                        )
                );
            }
        };
    }
}