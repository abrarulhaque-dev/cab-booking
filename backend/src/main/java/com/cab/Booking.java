package com.cab;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    public String username, ref, firstName, surname, address, postcode, telephone, mobile, email;
    public String pickup, dropoff, carType, journeyType;
    public int pooling;
    public boolean insurance, luggage;
    public int km;
    public double base, subtotal, tax, total;
    public LocalDateTime createdAt = LocalDateTime.now();
}
