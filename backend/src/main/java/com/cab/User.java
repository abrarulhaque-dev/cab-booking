package com.cab;

import jakarta.persistence.*;

@Entity @Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(unique = true, nullable = false) public String username;
    @Column(nullable = false) public String salt;
    @Column(nullable = false) public String hash;
}
