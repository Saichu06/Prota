package com.prota.service.report;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.prota.entity.*;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

@Component
public class PdfReportGenerator {

    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("MMMM d, yyyy");
    private static final DateTimeFormatter SHORT_DATE = DateTimeFormatter.ofPattern("MMM d, yyyy");
    private static final BigDecimal KG_TO_LBS = new BigDecimal("2.20462");

    // Prota Brand Palette
    private static final Color COLOR_PRIMARY = new Color(15, 23, 42);     // Slate 900
    private static final Color COLOR_ACCENT = new Color(5, 150, 105);     // Emerald 600
    private static final Color COLOR_BG_LIGHT = new Color(248, 250, 252); // Slate 50
    private static final Color COLOR_BG_HEADER = new Color(15, 23, 42);   // Slate 900
    private static final Color COLOR_BORDER = new Color(226, 232, 240);   // Slate 200
    private static final Color COLOR_TEXT_MUTED = new Color(100, 116, 139); // Slate 500
    private static final Color COLOR_TEXT_DARK = new Color(30, 41, 59);   // Slate 800

    private final ObjectMapper objectMapper;

    public PdfReportGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private void addBrandHeader(Document document, String reportTitle, String subtitle, String userEmail, String timezone) throws DocumentException {
        // Brand Header Table
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{65f, 35f});
        headerTable.setSpacingAfter(12f);

        // Left Column: PROTA brand and report title
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(0);

        Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, COLOR_ACCENT);
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, COLOR_PRIMARY);
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, COLOR_TEXT_MUTED);

        Paragraph brandP = new Paragraph("PROTA NUTRITION & WELLNESS", brandFont);
        Paragraph titleP = new Paragraph(reportTitle, titleFont);
        Paragraph subP = new Paragraph(subtitle, subtitleFont);

        leftCell.addElement(brandP);
        leftCell.addElement(titleP);
        leftCell.addElement(subP);
        headerTable.addCell(leftCell);

        // Right Column: Metadata
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightCell.setPadding(0);

        Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_MUTED);
        Paragraph metaP = new Paragraph();
        metaP.setAlignment(Element.ALIGN_RIGHT);
        metaP.add(new Chunk("Generated: " + LocalDate.now().format(DISPLAY_DATE) + "\n", metaFont));
        if (userEmail != null && !userEmail.isBlank()) {
            metaP.add(new Chunk("Account: " + userEmail + "\n", metaFont));
        }
        if (timezone != null && !timezone.isBlank()) {
            metaP.add(new Chunk("Timezone: " + timezone + "\n", metaFont));
        }
        rightCell.addElement(metaP);
        headerTable.addCell(rightCell);

        document.add(headerTable);

        // Accent Separator Line
        LineSeparator sep = new LineSeparator(1.5f, 100, COLOR_ACCENT, Element.ALIGN_CENTER, -2);
        document.add(sep);
        document.add(new Paragraph(" "));
    }

    private void addFooter(Document document) throws DocumentException {
        document.add(new Paragraph(" "));
        LineSeparator sep = new LineSeparator(0.5f, 100, COLOR_BORDER, Element.ALIGN_CENTER, 0);
        document.add(sep);

        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_MUTED);
        Paragraph footerP = new Paragraph(
                "Prota Nutrition Journal — Confidential Personal Report. " +
                "Nutrition and fitness records are for personal informational reference and do not constitute medical advice.",
                footerFont
        );
        footerP.setAlignment(Element.ALIGN_CENTER);
        footerP.setSpacingBefore(6f);
        document.add(footerP);
    }

    private PdfPCell createHeaderCell(String text, int align) {
        Font font = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(COLOR_BG_HEADER);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6f);
        cell.setBorderColor(COLOR_PRIMARY);
        return cell;
    }

    private PdfPCell createDataCell(String text, int align, boolean isAltRow) {
        Font font = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_TEXT_DARK);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(isAltRow ? COLOR_BG_LIGHT : Color.WHITE);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5f);
        cell.setBorderColor(COLOR_BORDER);
        return cell;
    }

    /**
     * Generates a comprehensive Daily Nutrition Report PDF.
     */
    public byte[] generateDailyNutritionReport(
            LocalDate date,
            DailyLog dailyLog,
            List<FoodEntry> entries,
            Integer waterMl,
            BigDecimal weightKg,
            UserSetting settings,
            String userEmail
    ) throws DocumentException {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        String timezone = dailyLog != null && dailyLog.getTimezoneAtCreation() != null
                ? dailyLog.getTimezoneAtCreation() : (settings != null ? settings.getTimezone() : "UTC");
        addBrandHeader(document, "Daily Nutrition Report", date.format(DISPLAY_DATE), userEmail, timezone);

        // Nutrition Totals Calculation
        BigDecimal totalProtein = entries.stream()
                .map(FoodEntry::getProteinG)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCalories = entries.stream()
                .map(FoodEntry::getCaloriesKcal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCarbs = entries.stream()
                .map(FoodEntry::getCarbohydratesG)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalFat = entries.stream()
                .map(FoodEntry::getFatG)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Daily Goals snapshot or current goal fallback
        BigDecimal proteinGoal = dailyLog != null && dailyLog.getProteinGoalG() != null
                ? dailyLog.getProteinGoalG() : (settings != null ? settings.getProteinGoalG() : null);
        BigDecimal calorieGoal = dailyLog != null && dailyLog.getCalorieGoalKcal() != null
                ? dailyLog.getCalorieGoalKcal() : (settings != null ? settings.getCalorieGoalKcal() : null);
        Integer waterGoal = dailyLog != null && dailyLog.getWaterGoalMl() != null
                ? dailyLog.getWaterGoalMl() : (settings != null ? settings.getWaterGoalMl() : null);

        // Macro Summary Cards Table
        PdfPTable summaryTable = new PdfPTable(5);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(16f);

        summaryTable.addCell(createSummaryCard("PROTEIN", totalProtein.setScale(1, RoundingMode.HALF_UP) + " g",
                proteinGoal != null ? "Goal: " + proteinGoal.setScale(0, RoundingMode.HALF_UP) + "g" : "No goal set"));
        summaryTable.addCell(createSummaryCard("CALORIES", totalCalories.setScale(0, RoundingMode.HALF_UP) + " kcal",
                calorieGoal != null ? "Goal: " + calorieGoal.setScale(0, RoundingMode.HALF_UP) + "kcal" : "No goal set"));
        summaryTable.addCell(createSummaryCard("CARBS", totalCarbs.setScale(1, RoundingMode.HALF_UP) + " g", "—"));
        summaryTable.addCell(createSummaryCard("FAT", totalFat.setScale(1, RoundingMode.HALF_UP) + " g", "—"));
        summaryTable.addCell(createSummaryCard("HYDRATION", waterMl != null ? waterMl + " ml" : "Not logged",
                waterGoal != null ? "Goal: " + waterGoal + "ml" : "No goal set"));

        document.add(summaryTable);

        // Detailed Food Entries Table
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_PRIMARY);
        document.add(new Paragraph("Meals & Recorded Food Items", sectionFont));
        document.add(new Paragraph(" "));

        if (entries.isEmpty()) {
            Font emptyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, COLOR_TEXT_MUTED);
            document.add(new Paragraph("No individual food entries were logged for this date.", emptyFont));
        } else {
            PdfPTable foodTable = new PdfPTable(7);
            foodTable.setWidthPercentage(100);
            foodTable.setWidths(new float[]{15f, 30f, 15f, 10f, 10f, 10f, 10f});

            foodTable.addCell(createHeaderCell("Meal", Element.ALIGN_LEFT));
            foodTable.addCell(createHeaderCell("Food Item", Element.ALIGN_LEFT));
            foodTable.addCell(createHeaderCell("Portion", Element.ALIGN_LEFT));
            foodTable.addCell(createHeaderCell("Protein", Element.ALIGN_RIGHT));
            foodTable.addCell(createHeaderCell("Calories", Element.ALIGN_RIGHT));
            foodTable.addCell(createHeaderCell("Carbs", Element.ALIGN_RIGHT));
            foodTable.addCell(createHeaderCell("Fat", Element.ALIGN_RIGHT));

            boolean alt = false;
            for (FoodEntry fe : entries) {
                foodTable.addCell(createDataCell(fe.getMealType() != null ? fe.getMealType().name() : "SNACK", Element.ALIGN_LEFT, alt));
                foodTable.addCell(createDataCell(fe.getFoodName(), Element.ALIGN_LEFT, alt));
                foodTable.addCell(createDataCell(fe.getQuantity().toPlainString() + " " + fe.getQuantityUnit(), Element.ALIGN_LEFT, alt));
                foodTable.addCell(createDataCell(fe.getProteinG().setScale(1, RoundingMode.HALF_UP).toPlainString() + "g", Element.ALIGN_RIGHT, alt));
                foodTable.addCell(createDataCell(fe.getCaloriesKcal() != null ? fe.getCaloriesKcal().setScale(0, RoundingMode.HALF_UP).toPlainString() : "—", Element.ALIGN_RIGHT, alt));
                foodTable.addCell(createDataCell(fe.getCarbohydratesG() != null ? fe.getCarbohydratesG().setScale(1, RoundingMode.HALF_UP).toPlainString() + "g" : "—", Element.ALIGN_RIGHT, alt));
                foodTable.addCell(createDataCell(fe.getFatG() != null ? fe.getFatG().setScale(1, RoundingMode.HALF_UP).toPlainString() + "g" : "—", Element.ALIGN_RIGHT, alt));
                alt = !alt;
            }

            document.add(foodTable);
        }

        if (weightKg != null) {
            document.add(new Paragraph(" "));
            Font weightFont = FontFactory.getFont(FontFactory.HELVETICA, 10, COLOR_TEXT_DARK);
            document.add(new Paragraph("Bodyweight on this date: " + weightKg.setScale(2, RoundingMode.HALF_UP) + " kg (" +
                    weightKg.multiply(KG_TO_LBS).setScale(1, RoundingMode.HALF_UP) + " lbs)", weightFont));
        }

        addFooter(document);
        document.close();
        return baos.toByteArray();
    }

    private PdfPCell createSummaryCard(String title, String mainValue, String subText) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_BG_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(8f);

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, COLOR_TEXT_MUTED);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_PRIMARY);
        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 7, COLOR_ACCENT);

        Paragraph p = new Paragraph();
        p.add(new Chunk(title + "\n", titleFont));
        p.add(new Chunk(mainValue + "\n", valueFont));
        p.add(new Chunk(subText, subFont));
        cell.addElement(p);
        return cell;
    }

    /**
     * Generates a Period Summary Report PDF (Weekly, Monthly, or Custom Range).
     */
    public byte[] generateRangeNutritionReport(
            String periodTitle,
            LocalDate startDate,
            LocalDate endDate,
            List<DailyLog> dailyLogs,
            Map<LocalDate, List<FoodEntry>> foodEntriesByDate,
            Map<LocalDate, Integer> waterByDate,
            Map<LocalDate, BigDecimal> weightByDate,
            UserSetting settings,
            String userEmail,
            boolean includeDetails
    ) throws DocumentException {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        String timezone = settings != null && settings.getTimezone() != null ? settings.getTimezone() : "UTC";
        addBrandHeader(document, periodTitle, startDate.format(DISPLAY_DATE) + " – " + endDate.format(DISPLAY_DATE), userEmail, timezone);

        int totalDays = (int) (java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1);
        int recordedDays = 0;
        BigDecimal sumProtein = BigDecimal.ZERO;
        BigDecimal sumCalories = BigDecimal.ZERO;
        int totalWaterMl = 0;
        int waterRecordedDays = 0;

        for (DailyLog log : dailyLogs) {
            List<FoodEntry> entries = foodEntriesByDate.getOrDefault(log.getLogDate(), List.of());
            if (!entries.isEmpty()) {
                recordedDays++;
                BigDecimal dayProtein = entries.stream().map(FoodEntry::getProteinG).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal dayCalories = entries.stream().map(FoodEntry::getCaloriesKcal).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
                sumProtein = sumProtein.add(dayProtein);
                sumCalories = sumCalories.add(dayCalories);
            }
            Integer water = waterByDate.get(log.getLogDate());
            if (water != null && water > 0) {
                totalWaterMl += water;
                waterRecordedDays++;
            }
        }

        BigDecimal avgProtein = recordedDays > 0 ? sumProtein.divide(BigDecimal.valueOf(recordedDays), 1, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal avgCalories = recordedDays > 0 ? sumCalories.divide(BigDecimal.valueOf(recordedDays), 0, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        int avgWater = waterRecordedDays > 0 ? totalWaterMl / waterRecordedDays : 0;

        // Executive Summary Cards
        PdfPTable summaryTable = new PdfPTable(4);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(14f);

        summaryTable.addCell(createSummaryCard("TRACKING ADHERENCE", recordedDays + " of " + totalDays + " days",
                totalDays > 0 ? (recordedDays * 100 / totalDays) + "% active days" : "—"));
        summaryTable.addCell(createSummaryCard("AVG DAILY PROTEIN", avgProtein + " g",
                "Denominator: " + recordedDays + " logged days"));
        summaryTable.addCell(createSummaryCard("AVG DAILY CALORIES", avgCalories + " kcal",
                "Denominator: " + recordedDays + " logged days"));
        summaryTable.addCell(createSummaryCard("AVG DAILY WATER", avgWater > 0 ? avgWater + " ml" : "—",
                waterRecordedDays + " logged days"));

        document.add(summaryTable);

        // Daily Progression Table
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_PRIMARY);
        document.add(new Paragraph("Daily Breakdown", sectionFont));
        document.add(new Paragraph(" "));

        PdfPTable dailyTable = new PdfPTable(7);
        dailyTable.setWidthPercentage(100);
        dailyTable.setWidths(new float[]{16f, 14f, 14f, 14f, 14f, 14f, 14f});

        dailyTable.addCell(createHeaderCell("Date", Element.ALIGN_LEFT));
        dailyTable.addCell(createHeaderCell("Status", Element.ALIGN_LEFT));
        dailyTable.addCell(createHeaderCell("Protein", Element.ALIGN_RIGHT));
        dailyTable.addCell(createHeaderCell("Calories", Element.ALIGN_RIGHT));
        dailyTable.addCell(createHeaderCell("Carbs", Element.ALIGN_RIGHT));
        dailyTable.addCell(createHeaderCell("Hydration", Element.ALIGN_RIGHT));
        dailyTable.addCell(createHeaderCell("Weight", Element.ALIGN_RIGHT));

        boolean alt = false;
        for (DailyLog log : dailyLogs) {
            LocalDate d = log.getLogDate();
            List<FoodEntry> entries = foodEntriesByDate.getOrDefault(d, List.of());
            boolean hasData = !entries.isEmpty();

            BigDecimal p = entries.stream().map(FoodEntry::getProteinG).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal c = entries.stream().map(FoodEntry::getCaloriesKcal).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal cb = entries.stream().map(FoodEntry::getCarbohydratesG).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
            Integer w = waterByDate.get(d);
            BigDecimal wt = weightByDate.get(d);

            dailyTable.addCell(createDataCell(d.format(SHORT_DATE), Element.ALIGN_LEFT, alt));
            dailyTable.addCell(createDataCell(hasData ? "Logged" : "No entries", Element.ALIGN_LEFT, alt));
            dailyTable.addCell(createDataCell(hasData ? p.setScale(1, RoundingMode.HALF_UP) + "g" : "—", Element.ALIGN_RIGHT, alt));
            dailyTable.addCell(createDataCell(hasData ? c.setScale(0, RoundingMode.HALF_UP) + " kcal" : "—", Element.ALIGN_RIGHT, alt));
            dailyTable.addCell(createDataCell(hasData && cb.compareTo(BigDecimal.ZERO) > 0 ? cb.setScale(1, RoundingMode.HALF_UP) + "g" : "—", Element.ALIGN_RIGHT, alt));
            dailyTable.addCell(createDataCell(w != null ? w + " ml" : "—", Element.ALIGN_RIGHT, alt));
            dailyTable.addCell(createDataCell(wt != null ? wt.setScale(1, RoundingMode.HALF_UP) + " kg" : "—", Element.ALIGN_RIGHT, alt));
            alt = !alt;
        }

        document.add(dailyTable);

        // Weight Trend Analysis section
        List<Map.Entry<LocalDate, BigDecimal>> weightEntries = weightByDate.entrySet().stream()
                .filter(e -> e.getValue() != null)
                .sorted(Map.Entry.comparingByKey())
                .toList();

        document.add(new Paragraph(" "));
        document.add(new Paragraph("Weight Trend Analysis", sectionFont));
        document.add(new Paragraph(" "));

        Font noteFont = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_TEXT_DARK);
        if (weightEntries.size() < 2) {
            Font mutedFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, COLOR_TEXT_MUTED);
            document.add(new Paragraph(
                    "Insufficient measurements recorded in this timeframe to establish a valid trend (minimum 2 entries required; found "
                            + weightEntries.size() + ").",
                    mutedFont
            ));
        } else {
            BigDecimal startWt = weightEntries.get(0).getValue();
            BigDecimal endWt = weightEntries.get(weightEntries.size() - 1).getValue();
            BigDecimal diff = endWt.subtract(startWt);
            String sign = diff.compareTo(BigDecimal.ZERO) > 0 ? "+" : "";

            Paragraph wtP = new Paragraph();
            wtP.add(new Chunk("Initial: " + startWt.setScale(2, RoundingMode.HALF_UP) + " kg (" + weightEntries.get(0).getKey().format(SHORT_DATE) + ")   |   ", noteFont));
            wtP.add(new Chunk("Latest: " + endWt.setScale(2, RoundingMode.HALF_UP) + " kg (" + weightEntries.get(weightEntries.size() - 1).getKey().format(SHORT_DATE) + ")   |   ", noteFont));
            wtP.add(new Chunk("Net Change: " + sign + diff.setScale(2, RoundingMode.HALF_UP) + " kg (" + sign + diff.multiply(KG_TO_LBS).setScale(2, RoundingMode.HALF_UP) + " lbs)", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_PRIMARY)));
            document.add(wtP);
        }

        addFooter(document);
        document.close();
        return baos.toByteArray();
    }

    /**
     * Generates a Weight Progress Report PDF.
     */
    public byte[] generateWeightReport(
            LocalDate startDate,
            LocalDate endDate,
            List<WeightEntry> entries,
            String weightUnit,
            UserSetting settings,
            String userEmail
    ) throws DocumentException {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        String timezone = settings != null && settings.getTimezone() != null ? settings.getTimezone() : "UTC";
        addBrandHeader(document, "Weight Progress Report", startDate.format(DISPLAY_DATE) + " – " + endDate.format(DISPLAY_DATE), userEmail, timezone);

        boolean useLbs = "LBS".equalsIgnoreCase(weightUnit);
        String unitLabel = useLbs ? "lbs" : "kg";

        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_PRIMARY);

        if (entries.isEmpty()) {
            Font emptyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, COLOR_TEXT_MUTED);
            document.add(new Paragraph("No weight records found in the selected date range.", emptyFont));
        } else {
            BigDecimal firstWt = entries.get(0).getWeightKg();
            BigDecimal lastWt = entries.get(entries.size() - 1).getWeightKg();
            BigDecimal netChange = lastWt.subtract(firstWt);

            BigDecimal displayFirst = useLbs ? firstWt.multiply(KG_TO_LBS) : firstWt;
            BigDecimal displayLast = useLbs ? lastWt.multiply(KG_TO_LBS) : lastWt;
            BigDecimal displayChange = useLbs ? netChange.multiply(KG_TO_LBS) : netChange;

            // Summary Cards
            PdfPTable summaryTable = new PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(14f);

            summaryTable.addCell(createSummaryCard("START WEIGHT", displayFirst.setScale(1, RoundingMode.HALF_UP) + " " + unitLabel, entries.get(0).getEntryDate().format(SHORT_DATE)));
            summaryTable.addCell(createSummaryCard("CURRENT WEIGHT", displayLast.setScale(1, RoundingMode.HALF_UP) + " " + unitLabel, entries.get(entries.size() - 1).getEntryDate().format(SHORT_DATE)));
            String sign = displayChange.compareTo(BigDecimal.ZERO) > 0 ? "+" : "";
            summaryTable.addCell(createSummaryCard("NET CHANGE", sign + displayChange.setScale(2, RoundingMode.HALF_UP) + " " + unitLabel, entries.size() + " total entries"));
            summaryTable.addCell(createSummaryCard("MEASUREMENTS", String.valueOf(entries.size()), entries.size() >= 2 ? "Valid trend" : "Insufficient data"));

            document.add(summaryTable);

            document.add(new Paragraph("Measurement Log", sectionFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{25f, 25f, 25f, 25f});

            table.addCell(createHeaderCell("Date", Element.ALIGN_LEFT));
            table.addCell(createHeaderCell("Weight (" + unitLabel + ")", Element.ALIGN_RIGHT));
            table.addCell(createHeaderCell("Change from Start", Element.ALIGN_RIGHT));
            table.addCell(createHeaderCell("Notes", Element.ALIGN_LEFT));

            boolean alt = false;
            for (WeightEntry we : entries) {
                BigDecimal cur = useLbs ? we.getWeightKg().multiply(KG_TO_LBS) : we.getWeightKg();
                BigDecimal delta = cur.subtract(displayFirst);
                String deltaSign = delta.compareTo(BigDecimal.ZERO) > 0 ? "+" : "";

                table.addCell(createDataCell(we.getEntryDate().format(SHORT_DATE), Element.ALIGN_LEFT, alt));
                table.addCell(createDataCell(cur.setScale(2, RoundingMode.HALF_UP).toPlainString() + " " + unitLabel, Element.ALIGN_RIGHT, alt));
                table.addCell(createDataCell(deltaSign + delta.setScale(2, RoundingMode.HALF_UP).toPlainString() + " " + unitLabel, Element.ALIGN_RIGHT, alt));
                table.addCell(createDataCell(we.getNotes() != null ? we.getNotes() : "—", Element.ALIGN_LEFT, alt));
                alt = !alt;
            }
            document.add(table);
        }

        addFooter(document);
        document.close();
        return baos.toByteArray();
    }

    /**
     * Generates a Saved Diet Plan Export PDF.
     */
    public byte[] generateSavedDietPlanReport(DietPlan plan, UserSetting settings, String userEmail) throws DocumentException {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        String timezone = settings != null && settings.getTimezone() != null ? settings.getTimezone() : "UTC";
        addBrandHeader(document, "Saved Diet Plan Report", plan.getTitle(), userEmail, timezone);

        // Macro Targets Table
        PdfPTable targetTable = new PdfPTable(4);
        targetTable.setWidthPercentage(100);
        targetTable.setSpacingAfter(14f);

        targetTable.addCell(createSummaryCard("TARGET CALORIES", plan.getDailyCaloriesKcal().setScale(0, RoundingMode.HALF_UP) + " kcal", "Daily Target"));
        targetTable.addCell(createSummaryCard("TARGET PROTEIN", plan.getDailyProteinG().setScale(1, RoundingMode.HALF_UP) + " g", "Daily Target"));
        targetTable.addCell(createSummaryCard("GOAL", plan.getGoal() != null ? plan.getGoal().name() : "CUSTOM", "Nutritional Target"));
        targetTable.addCell(createSummaryCard("CREATED", plan.getCreatedAt() != null ? plan.getCreatedAt().toString().substring(0, 10) : "Saved Version", "Archived Plan"));

        document.add(targetTable);

        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_PRIMARY);
        document.add(new Paragraph("Plan Details & Daily Menu", sectionFont));
        document.add(new Paragraph(" "));

        try {
            JsonNode root = objectMapper.readTree(plan.getPlanJson());
            JsonNode meals = root.path("meals");
            if (meals.isArray() && meals.size() > 0) {
                PdfPTable mealsTable = new PdfPTable(5);
                mealsTable.setWidthPercentage(100);
                mealsTable.setWidths(new float[]{20f, 40f, 15f, 15f, 10f});

                mealsTable.addCell(createHeaderCell("Meal", Element.ALIGN_LEFT));
                mealsTable.addCell(createHeaderCell("Items & Suggestion", Element.ALIGN_LEFT));
                mealsTable.addCell(createHeaderCell("Calories", Element.ALIGN_RIGHT));
                mealsTable.addCell(createHeaderCell("Protein", Element.ALIGN_RIGHT));
                mealsTable.addCell(createHeaderCell("Carbs", Element.ALIGN_RIGHT));

                boolean alt = false;
                for (JsonNode m : meals) {
                    String mealName = m.path("name").asText("Meal");
                    String desc = m.path("description").asText("");
                    String cal = m.path("calories").asText("—");
                    String prot = m.path("protein").asText("—");
                    String carb = m.path("carbs").asText("—");

                    mealsTable.addCell(createDataCell(mealName, Element.ALIGN_LEFT, alt));
                    mealsTable.addCell(createDataCell(desc, Element.ALIGN_LEFT, alt));
                    mealsTable.addCell(createDataCell(cal, Element.ALIGN_RIGHT, alt));
                    mealsTable.addCell(createDataCell(prot, Element.ALIGN_RIGHT, alt));
                    mealsTable.addCell(createDataCell(carb, Element.ALIGN_RIGHT, alt));
                    alt = !alt;
                }
                document.add(mealsTable);
            } else {
                Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_TEXT_DARK);
                document.add(new Paragraph(root.toPrettyString(), bodyFont));
            }
        } catch (Exception e) {
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_TEXT_DARK);
            document.add(new Paragraph(plan.getPlanJson(), bodyFont));
        }

        // Disclaimer Callout
        document.add(new Paragraph(" "));
        Font discFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, COLOR_TEXT_MUTED);
        document.add(new Paragraph("Notice: This diet plan was generated by AI and approved by the user. It is for informational and educational guidance. Always consult with a licensed healthcare professional before making substantial dietary shifts.", discFont));

        addFooter(document);
        document.close();
        return baos.toByteArray();
    }

    /**
     * Generates a Saved Workout Plan Export PDF.
     */
    public byte[] generateSavedWorkoutPlanReport(WorkoutPlan plan, UserSetting settings, String userEmail) throws DocumentException {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);

        document.open();

        String timezone = settings != null && settings.getTimezone() != null ? settings.getTimezone() : "UTC";
        addBrandHeader(document, "Saved Workout Plan Report", plan.getTitle(), userEmail, timezone);

        // Parameters Table
        PdfPTable targetTable = new PdfPTable(4);
        targetTable.setWidthPercentage(100);
        targetTable.setSpacingAfter(14f);

        targetTable.addCell(createSummaryCard("PRIMARY GOAL", plan.getPrimaryGoal() != null ? plan.getPrimaryGoal().name() : "FITNESS", "Target Focus"));
        targetTable.addCell(createSummaryCard("SPLIT TYPE", plan.getSplitType() != null ? plan.getSplitType().name() : "ROUTINE", plan.getDaysPerWeek() + " days/week"));
        targetTable.addCell(createSummaryCard("EXPERIENCE", plan.getExperienceLevel() != null ? plan.getExperienceLevel().name() : "GENERAL", plan.getSessionDurationMins() + " mins/session"));
        targetTable.addCell(createSummaryCard("LOCATION", plan.getTrainingLocation() != null ? plan.getTrainingLocation().name() : "GYM", "Equipment Environment"));

        document.add(targetTable);

        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_PRIMARY);
        document.add(new Paragraph("Routine Schedule & Exercise Prescriptions", sectionFont));
        document.add(new Paragraph(" "));

        try {
            JsonNode root = objectMapper.readTree(plan.getPlanJson());
            JsonNode days = root.path("days");
            if (days.isArray() && days.size() > 0) {
                for (JsonNode day : days) {
                    String dayTitle = day.path("dayName").asText(day.path("day").asText("Training Day"));
                    String focus = day.path("focus").asText("");
                    Font dayFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_ACCENT);
                    document.add(new Paragraph(dayTitle + (focus.isEmpty() ? "" : " — " + focus), dayFont));
                    document.add(new Paragraph(" "));

                    JsonNode exercises = day.path("exercises");
                    if (exercises.isArray() && exercises.size() > 0) {
                        PdfPTable exTable = new PdfPTable(4);
                        exTable.setWidthPercentage(100);
                        exTable.setWidths(new float[]{40f, 15f, 15f, 30f});
                        exTable.setSpacingAfter(10f);

                        exTable.addCell(createHeaderCell("Exercise", Element.ALIGN_LEFT));
                        exTable.addCell(createHeaderCell("Sets", Element.ALIGN_RIGHT));
                        exTable.addCell(createHeaderCell("Reps / Duration", Element.ALIGN_RIGHT));
                        exTable.addCell(createHeaderCell("Cues / Notes", Element.ALIGN_LEFT));

                        boolean alt = false;
                        for (JsonNode ex : exercises) {
                            String name = ex.path("name").asText("Exercise");
                            String sets = ex.path("sets").asText("—");
                            String reps = ex.path("reps").asText(ex.path("duration").asText("—"));
                            String notes = ex.path("notes").asText("—");

                            exTable.addCell(createDataCell(name, Element.ALIGN_LEFT, alt));
                            exTable.addCell(createDataCell(sets, Element.ALIGN_RIGHT, alt));
                            exTable.addCell(createDataCell(reps, Element.ALIGN_RIGHT, alt));
                            exTable.addCell(createDataCell(notes, Element.ALIGN_LEFT, alt));
                            alt = !alt;
                        }
                        document.add(exTable);
                    }
                }
            } else {
                Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_TEXT_DARK);
                document.add(new Paragraph(root.toPrettyString(), bodyFont));
            }
        } catch (Exception e) {
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_TEXT_DARK);
            document.add(new Paragraph(plan.getPlanJson(), bodyFont));
        }

        // Disclaimer Callout
        document.add(new Paragraph(" "));
        Font discFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, COLOR_TEXT_MUTED);
        document.add(new Paragraph("Notice: This workout program is an illustrative fitness recommendation. Always practice proper form and consult a doctor before commencing rigorous physical exercise.", discFont));

        addFooter(document);
        document.close();
        return baos.toByteArray();
    }
}
