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
    CommandLineRunner seedDatabase(
            ProductRepository productRepository,
            OrderRepository orderRepository) {

        return args -> {

            /*
             * Seed products only when the database is empty.
             *
             * Because the database is now configured as a persistent
             * H2 file database, existing products will not be recreated
             * every time the container starts.
             */
            if (productRepository.count() == 0) {

                Product macbook = new Product(
                        "MacBook Air M5",
                        "LAP-001",
                        "Laptops",
                        119999,
                        20
                );

                Product keyboard = new Product(
                        "Mechanical Keyboard",
                        "KEY-014",
                        "Accessories",
                        7499,
                        5
                );

                Product monitor = new Product(
                        "4K Monitor",
                        "MON-027",
                        "Displays",
                        28999,
                        2
                );

                Product mouse = new Product(
                        "Wireless Mouse",
                        "MOU-032",
                        "Accessories",
                        2499,
                        46
                );

                productRepository.save(macbook);
                productRepository.save(keyboard);
                productRepository.save(monitor);
                productRepository.save(mouse);
            }

            /*
             * Seed sample orders only when the order table is empty.
             *
             * Amount values use .0 because CustomerOrder.amount
             * is now a Double.
             */
            if (orderRepository.count() == 0) {

                CustomerOrder order1 =
                        new CustomerOrder(
                                "Rahul Sharma",
                                1L,
                                1,
                                119999.0,
                                "Pending"
                        );

                CustomerOrder order2 =
                        new CustomerOrder(
                                "Ananya Mehta",
                                4L,
                                2,
                                4998.0,
                                "Shipped"
                        );

                CustomerOrder order3 =
                        new CustomerOrder(
                                "Rohan Patil",
                                3L,
                                1,
                                28999.0,
                                "Delivered"
                        );

                CustomerOrder order4 =
                        new CustomerOrder(
                                "Sneha Joshi",
                                2L,
                                1,
                                7499.0,
                                "Processing"
                        );

                orderRepository.save(order1);
                orderRepository.save(order2);
                orderRepository.save(order3);
                orderRepository.save(order4);
            }
        };
    }
}