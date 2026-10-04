package com.cloudinventory.repository;

import com.cloudinventory.model.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {
}