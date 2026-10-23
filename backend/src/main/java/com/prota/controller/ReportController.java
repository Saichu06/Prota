package com.prota.controller;

import com.prota.dto.report.CsvExportType;
import com.prota.dto.report.ReportPreviewResponse;
import com.prota.dto.report.ReportType;
import com.prota.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/preview")
    public ResponseEntity<ReportPreviewResponse> getReportPreview(
            @RequestParam(value = "type", required = false, defaultValue = "DAILY_NUTRITION") ReportType type,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "planId", required = false) UUID planId
    ) {
        ReportPreviewResponse preview = reportService.getReportPreview(type, from, to, planId);
        return ResponseEntity.ok(preview);
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> downloadPdfReport(
            @RequestParam("type") ReportType type,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "planId", required = false) UUID planId,
            @RequestParam(value = "weightUnit", required = false, defaultValue = "KG") String weightUnit,
            @RequestParam(value = "includeDetails", required = false, defaultValue = "true") boolean includeDetails
    ) {
        byte[] pdfBytes = reportService.generatePdfReport(type, from, to, planId, weightUnit, includeDetails);

        String filename = buildPdfFilename(type, from, to);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdfBytes);
    }

    @GetMapping("/csv")
    public ResponseEntity<byte[]> downloadCsvExport(
            @RequestParam("type") CsvExportType type,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        byte[] csvBytes = reportService.generateCsvExport(type, from, to);

        String filename = buildCsvFilename(type, from, to);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(csvBytes);
    }

    private String buildPdfFilename(ReportType type, LocalDate from, LocalDate to) {
        String base = switch (type) {
            case DAILY_NUTRITION -> "prota_daily_nutrition_" + (from != null ? from : LocalDate.now());
            case WEEKLY_NUTRITION -> "prota_weekly_nutrition_" + (to != null ? to : LocalDate.now());
            case MONTHLY_NUTRITION -> "prota_monthly_nutrition_" + (to != null ? to : LocalDate.now());
            case CUSTOM_RANGE -> "prota_custom_range_" + (from != null ? from : "") + "_to_" + (to != null ? to : "");
            case WEIGHT_PROGRESS -> "prota_weight_progress_" + (from != null ? from : "") + "_to_" + (to != null ? to : "");
            case SAVED_DIET_PLAN -> "prota_saved_diet_plan";
            case SAVED_WORKOUT_PLAN -> "prota_saved_workout_plan";
        };
        return base.replaceAll("[^a-zA-Z0-9_.-]", "_") + ".pdf";
    }

    private String buildCsvFilename(CsvExportType type, LocalDate from, LocalDate to) {
        String dateSuffix = (from != null ? from.toString() : "") + "_to_" + (to != null ? to.toString() : LocalDate.now().toString());
        String base = switch (type) {
            case FOOD_ENTRIES -> "prota_food_entries_" + dateSuffix;
            case DAILY_SUMMARIES -> "prota_daily_summaries_" + dateSuffix;
            case HYDRATION -> "prota_hydration_" + dateSuffix;
            case WEIGHT -> "prota_weight_" + dateSuffix;
        };
        return base.replaceAll("[^a-zA-Z0-9_.-]", "_") + ".csv";
    }
}
