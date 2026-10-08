package com.cab;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController @RequestMapping("/api")
public class ApiController {
    private final UserRepo users; private final BookingRepo bookings; private final FareService fares;
    private final Map<String, String> sessions = new ConcurrentHashMap<>(); // token -> username (in-memory)

    public ApiController(UserRepo u, BookingRepo b, FareService f) { users = u; bookings = b; fares = f; }

    record Creds(String username, String password) {}
    record FareReq(String pickup, String dropoff, String carType, String journeyType, boolean insurance, boolean luggage) {}
    public record BookingReq(String firstName, String surname, String address, String postcode, String telephone,
                             String mobile, String email, int pooling, FareReq trip) {}

    // ---- auth ----
    @PostMapping("/auth/register")
    public Map<String, String> register(@RequestBody Creds c) {
        if (blank(c.username()) || blank(c.password()) || c.password().length() < 4)
            throw bad("Username and a password of at least 4 characters are required");
        if (users.findByUsername(c.username().trim()).isPresent()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        User u = new User(); u.username = c.username().trim();
        byte[] salt = new byte[16]; new SecureRandom().nextBytes(salt);
        u.salt = Base64.getEncoder().encodeToString(salt); u.hash = hash(c.password(), salt);
        users.save(u);
        return Map.of("message", "Account created");
    }

    @PostMapping("/auth/login")
    public Map<String, String> login(@RequestBody Creds c) {
        User u = users.findByUsername(c.username() == null ? "" : c.username().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password"));
        if (!u.hash.equals(hash(c.password() == null ? "" : c.password(), Base64.getDecoder().decode(u.salt))))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password");
        String token = UUID.randomUUID().toString(); sessions.put(token, u.username);
        return Map.of("token", token, "username", u.username);
    }

    // ---- booking ----
    @GetMapping("/locations") public List<String> locations() { return FareService.LOCATIONS; }

    @PostMapping("/fare")
    public FareService.Quote fare(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody FareReq r) {
        user(auth);
        return quote(r);
    }

    @PostMapping("/bookings")
    public Booking book(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody BookingReq r) {
        String username = user(auth);
        if (blank(r.firstName()) || blank(r.surname()) || blank(r.address()) || blank(r.postcode())
            || blank(r.telephone()) || blank(r.mobile()) || blank(r.email())) throw bad("Fill in all customer details");
        if (r.pooling() < 1 || r.pooling() > 4) throw bad("Pooling must be between 1 and 4");
        FareService.Quote q = quote(r.trip());
        Booking b = new Booking();
        b.username = username; b.ref = String.valueOf(10853 + new SecureRandom().nextInt(489978));
        b.firstName = r.firstName(); b.surname = r.surname(); b.address = r.address(); b.postcode = r.postcode();
        b.telephone = r.telephone(); b.mobile = r.mobile(); b.email = r.email(); b.pooling = r.pooling();
        b.pickup = r.trip().pickup(); b.dropoff = r.trip().dropoff(); b.carType = r.trip().carType();
        b.journeyType = r.trip().journeyType(); b.insurance = r.trip().insurance(); b.luggage = r.trip().luggage();
        b.km = q.km(); b.base = q.base(); b.subtotal = q.subtotal(); b.tax = q.tax(); b.total = q.total();
        return bookings.save(b);
    }

    @GetMapping("/bookings")
    public List<Booking> mine(@RequestHeader(value = "Authorization", required = false) String auth) {
        return bookings.findByUsernameOrderByCreatedAtDesc(user(auth));
    }

    // ---- helpers ----
    private FareService.Quote quote(FareReq r) {
        try { return fares.quote(r.pickup(), r.dropoff(), r.carType(), r.journeyType(), r.insurance(), r.luggage()); }
        catch (IllegalArgumentException e) { throw bad(e.getMessage()); }
    }
    private String user(String auth) {
        String t = auth == null ? "" : auth.replace("Bearer ", "");
        String u = sessions.get(t);
        if (u == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        return u;
    }
    private static boolean blank(String s) { return s == null || s.isBlank(); }
    private static ResponseStatusException bad(String m) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, m); }
    private static String hash(String pw, byte[] salt) {
        try {
            byte[] h = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(new PBEKeySpec(pw.toCharArray(), salt, 120_000, 256)).getEncoded();
            return Base64.getEncoder().encodeToString(h);
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
}
