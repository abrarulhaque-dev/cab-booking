package com.cab;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

/** Fare rules ported from the original tkinter app (tax fixed to 9% of subtotal). */
@Service
public class FareService {
    public static final List<String> LOCATIONS = List.of("BleckerStreet", "BoggessStreet", "NorthAvenue", "BrownAvenue");
    static final Map<String, Integer> DIST = Map.of(
        "BleckerStreet|BrownAvenue", 10, "BleckerStreet|NorthAvenue", 8, "BleckerStreet|BoggessStreet", 6,
        "BrownAvenue|NorthAvenue", 2, "BrownAvenue|BoggessStreet", 5, "NorthAvenue|BoggessStreet", 3);
    static final Map<String, Double> CAR_RATE = Map.of("STANDARD", 8.0, "PRIME", 15.0, "PREMIUM", 22.0);
    static final Map<String, Double> JOURNEY = Map.of("SINGLE", 1.0, "RETURN", 1.5, "SPECIAL", 2.0);
    static final double BASE = 50, INSURANCE = 10, LUGGAGE = 30, TAX = 0.09;

    public record Quote(int km, double base, double distanceCost, double insurance, double luggage,
                        double subtotal, double tax, double total) {}

    public int distance(String a, String b) {
        if (!LOCATIONS.contains(a) || !LOCATIONS.contains(b)) throw new IllegalArgumentException("Unknown location");
        if (a.equals(b)) return 0;
        Integer d = DIST.get(a + "|" + b);
        return d != null ? d : DIST.get(b + "|" + a);
    }

    public Quote quote(String pickup, String drop, String car, String journey, boolean ins, boolean lug) {
        if (!CAR_RATE.containsKey(car) || !JOURNEY.containsKey(journey)) throw new IllegalArgumentException("Invalid car or journey type");
        int km = distance(pickup, drop);
        double distCost = km * CAR_RATE.get(car) * JOURNEY.get(journey);
        double i = ins ? INSURANCE : 0, l = lug ? LUGGAGE : 0;
        double sub = BASE + distCost + i + l, tax = sub * TAX;
        return new Quote(km, BASE, distCost, i, l, r(sub), r(tax), r(sub + tax));
    }

    private static double r(double v) { return Math.round(v * 100) / 100.0; }
}
