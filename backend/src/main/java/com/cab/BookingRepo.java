package com.cab;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepo extends JpaRepository<Booking, Long> {
    List<Booking> findByUsernameOrderByCreatedAtDesc(String username);
}
