package com.prota.service.report;

import com.prota.entity.DailyLog;
import com.prota.entity.FoodEntry;
import com.prota.entity.WaterEntry;
import com.prota.entity.WeightEntry;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
public class CsvReportGenerator {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final BigDecimal KG_TO_LBS = new BigDecimal("2.20462");

    public static String escapeCsv(String value) {
        if (value == null) return "";
        String sanitized = value;
        // Formula injection defense: prepend single quote if starting with formula triggers
        if (!sanitized.isEmpty() && "=+-@\t\r".indexOf(sanitized.charAt(0)) >= 0) {
            sanitized = "'" + sanitized;
        }
        if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n") || sanitized.contains("\r")) {
            return "\"" + sanitized.replace("\"", "\"\"") + "\"";
        }
        return sanitized;
    }

    public byte[] generateFoodEntriesCsv(List<FoodEntry> entries) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            // Write UTF-8 BOM for seamless Excel compatibility
            writer.print('\ufeff');
            writer.println("Date,Meal Type,Food Name,Quantity,Unit,Protein (g),Calories (kcal),Carbohydrates (g),Fat (g),Source,Notes");

            for (FoodEntry fe : entries) {
                String date = fe.getDailyLog() != null && fe.getDailyLog().getLogDate() != null
                        ? fe.getDailyLog().getLogDate().format(ISO_DATE) : "";
                String meal = fe.getMealType() != null ? fe.getMealType().name() : "";
                String name = fe.getFoodName() != null ? fe.getFoodName() : "";
                String qty = fe.getQuantity() != null ? fe.getQuantity().toPlainString() : "";
                String unit = fe.getQuantityUnit() != null ? fe.getQuantityUnit() : "";
                String protein = fe.getProteinG() != null ? fe.getProteinG().toPlainString() : "";
                String calories = fe.getCaloriesKcal() != null ? fe.getCaloriesKcal().toPlainString() : "";
                String carbs = fe.getCarbohydratesG() != null ? fe.getCarbohydratesG().toPlainString() : "";
                String fat = fe.getFatG() != null ? fe.getFatG().toPlainString() : "";
                String source = fe.getNutritionSource() != null ? fe.getNutritionSource().name() : "";
                String notes = fe.getNotes() != null ? fe.getNotes() : "";

                writer.println(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s",
                        escapeCsv(date),
                        escapeCsv(meal),
                        escapeCsv(name),
                        escapeCsv(qty),
                        escapeCsv(unit),
                        escapeCsv(protein),
                        escapeCsv(calories),
                        escapeCsv(carbs),
                        escapeCsv(fat),
                        escapeCsv(source),
                        escapeCsv(notes)
                ));
            }
        }
        return baos.toByteArray();
    }

    public byte[] generateDailySummariesCsv(
            List<DailyLog> dailyLogs,
            Map<java.time.LocalDate, List<FoodEntry>> foodEntriesByDate,
            Map<java.time.LocalDate, Integer> waterByDate,
            Map<java.time.LocalDate, BigDecimal> weightByDate
    ) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            writer.print('\ufeff');
            writer.println("Date,Status,Protein (g),Protein Goal (g),Calories (kcal),Calorie Goal (kcal),Carbohydrates (g),Fat (g),Hydration (ml),Water Goal (ml),Weight (kg)");

            for (DailyLog log : dailyLogs) {
                String date = log.getLogDate().format(ISO_DATE);
                List<FoodEntry> entries = foodEntriesByDate.getOrDefault(log.getLogDate(), List.of());
                boolean hasEntries = !entries.isEmpty();

                BigDecimal totalProtein = entries.stream()
                        .map(FoodEntry::getProteinG)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalCalories = entries.stream()
                        .map(FoodEntry::getCaloriesKcal)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalCarbs = entries.stream()
                        .map(FoodEntry::getCarbohydratesG)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalFat = entries.stream()
                        .map(FoodEntry::getFatG)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                Integer waterMl = waterByDate.get(log.getLogDate());
                BigDecimal weight = weightByDate.get(log.getLogDate());

                String status = hasEntries ? "Logged" : "Empty Log";
                String proteinStr = hasEntries ? totalProtein.setScale(1, RoundingMode.HALF_UP).toPlainString() : "";
                String proteinGoal = log.getProteinGoalG() != null ? log.getProteinGoalG().toPlainString() : "";
                String caloriesStr = hasEntries ? totalCalories.setScale(0, RoundingMode.HALF_UP).toPlainString() : "";
                String calorieGoal = log.getCalorieGoalKcal() != null ? log.getCalorieGoalKcal().toPlainString() : "";
                String carbsStr = hasEntries && totalCarbs.compareTo(BigDecimal.ZERO) > 0 ? totalCarbs.setScale(1, RoundingMode.HALF_UP).toPlainString() : "";
                String fatStr = hasEntries && totalFat.compareTo(BigDecimal.ZERO) > 0 ? totalFat.setScale(1, RoundingMode.HALF_UP).toPlainString() : "";
                String waterStr = waterMl != null ? String.valueOf(waterMl) : "";
                String waterGoal = log.getWaterGoalMl() != null ? String.valueOf(log.getWaterGoalMl()) : "";
                String weightStr = weight != null ? weight.setScale(2, RoundingMode.HALF_UP).toPlainString() : "";

                writer.println(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s",
                        escapeCsv(date),
                        escapeCsv(status),
                        escapeCsv(proteinStr),
                        escapeCsv(proteinGoal),
                        escapeCsv(caloriesStr),
                        escapeCsv(calorieGoal),
                        escapeCsv(carbsStr),
                        escapeCsv(fatStr),
                        escapeCsv(waterStr),
                        escapeCsv(waterGoal),
                        escapeCsv(weightStr)
                ));
            }
        }
        return baos.toByteArray();
    }

    public byte[] generateHydrationCsv(List<WaterEntry> waterEntries) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            writer.print('\ufeff');
            writer.println("Date,Consumed At,Amount (ml)");

            for (WaterEntry we : waterEntries) {
                String date = we.getEntryDate() != null ? we.getEntryDate().format(ISO_DATE) : "";
                String time = we.getConsumedAt() != null ? we.getConsumedAt().toString() : "";
                String amount = we.getAmountMl() != null ? String.valueOf(we.getAmountMl()) : "";

                writer.println(String.format("%s,%s,%s",
                        escapeCsv(date),
                        escapeCsv(time),
                        escapeCsv(amount)
                ));
            }
        }
        return baos.toByteArray();
    }

    public byte[] generateWeightCsv(List<WeightEntry> weightEntries) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            writer.print('\ufeff');
            writer.println("Date,Recorded At,Weight (kg),Weight (lbs),Notes");

            for (WeightEntry we : weightEntries) {
                String date = we.getEntryDate() != null ? we.getEntryDate().format(ISO_DATE) : "";
                String time = we.getRecordedAt() != null ? we.getRecordedAt().toString() : "";
                String weightKg = we.getWeightKg() != null ? we.getWeightKg().setScale(2, RoundingMode.HALF_UP).toPlainString() : "";
                String weightLbs = we.getWeightKg() != null ? we.getWeightKg().multiply(KG_TO_LBS).setScale(2, RoundingMode.HALF_UP).toPlainString() : "";
                String notes = we.getNotes() != null ? we.getNotes() : "";

                writer.println(String.format("%s,%s,%s,%s,%s",
                        escapeCsv(date),
                        escapeCsv(time),
                        escapeCsv(weightKg),
                        escapeCsv(weightLbs),
                        escapeCsv(notes)
                ));
            }
        }
        return baos.toByteArray();
    }
}
