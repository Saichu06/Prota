package com.prota.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.SaveWorkoutPlanRequest;
import com.prota.dto.request.WorkoutPlanGenerateRequest;
import com.prota.dto.response.*;
import com.prota.entity.User;
import com.prota.entity.WorkoutPlan;
import com.prota.entity.enums.ExperienceLevel;
import com.prota.entity.enums.SplitType;
import com.prota.entity.enums.TrainingLocation;
import com.prota.entity.enums.WorkoutGoal;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.UserRepository;
import com.prota.repo.WorkoutPlanRepository;
import com.prota.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class WorkoutPlanService {

    private static final Logger log = LoggerFactory.getLogger(WorkoutPlanService.class);

    private final GeminiClient geminiClient;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public WorkoutPlanService(
            GeminiClient geminiClient,
            WorkoutPlanRepository workoutPlanRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.workoutPlanRepository = workoutPlanRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Generates a tailored workout plan using Gemini with exercise safety,
     * equipment constraints, and recovery guidelines.
     */
    public WorkoutPlanDetailDto generatePlan(WorkoutPlanGenerateRequest request) {
        log.info("Generating workout plan for goal: {}, location: {}, days: {}",
                request.getPrimaryGoal(), request.getTrainingLocation(), request.getDaysPerWeek());

        // 1. Build Safety Notes & Disclaimers
        List<String> safetyNotes = new ArrayList<>();
        safetyNotes.add("Warm up adequately with 5–10 minutes of dynamic mobility before lifting.");
        safetyNotes.add("Always prioritize controlled form and full range of motion over excessive weight.");
        safetyNotes.add("Rest intervals are estimated for optimal ATP recovery; adjust based on individual conditioning.");

        if (request.getInjuriesOrLimitations() != null && !request.getInjuriesOrLimitations().isBlank()) {
            safetyNotes.add("Reported limitation: " + request.getInjuriesOrLimitations().trim());
            safetyNotes.add("Medical Advisory: Never train through sharp or worsening joint pain. Consult a physician or licensed physiotherapist for diagnosed clinical conditions.");
        }

        if (request.getDaysPerWeek() >= 6) {
            safetyNotes.add("High weekly frequency (6–7 days) requires strict sleep hygiene, hydration, and nutritional support to prevent central nervous system fatigue.");
        }

        // 2. Build Gemini prompt
        String prompt = buildPrompt(request);

        // 3. Call Gemini
        String aiRawResponse = null;
        if (geminiClient.isConfigured()) {
            try {
                aiRawResponse = geminiClient.generateStructuredTextEstimate(prompt);
            } catch (Exception e) {
                log.warn("Gemini call failed or timed out: {}. Using deterministic workout plan fallback.", e.getMessage());
            }
        } else {
            log.info("Gemini API key not configured. Using deterministic workout plan builder.");
        }

        // 4. Parse AI response or generate deterministic fallback
        WorkoutPlanDetailDto plan = parseAiResponse(aiRawResponse, request);
        if (plan == null || plan.getSessions() == null || plan.getSessions().isEmpty()) {
            log.info("Parsing AI response produced no valid sessions. Using deterministic program generator.");
            plan = buildDeterministicPlan(request);
        }

        // 5. Append safety notes & disclaimers
        if (plan.getSafetyNotes() == null || plan.getSafetyNotes().isEmpty()) {
            plan.setSafetyNotes(safetyNotes);
        } else {
            for (String note : safetyNotes) {
                if (!plan.getSafetyNotes().contains(note)) {
                    plan.getSafetyNotes().add(note);
                }
            }
        }

        plan.setDisclaimer("This generated routine is a fitness guidance tool based on exercise science principles. It does not replace personal medical advice or professional physical therapy. If you experience dizziness, sharp pain, or shortness of breath, discontinue training immediately.");
        plan.setCreationDate(LocalDate.now().toString());

        return plan;
    }

    /**
     * Persist a reviewed workout plan to PostgreSQL.
     */
    @Transactional
    public WorkoutPlanResponse savePlan(SaveWorkoutPlanRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String planJson;
        try {
            planJson = objectMapper.writeValueAsString(request.getPlanDetail());
        } catch (Exception e) {
            log.error("Failed to serialize WorkoutPlanDetailDto: {}", e.getMessage());
            planJson = "{}";
        }

        WorkoutPlan entity = WorkoutPlan.builder()
                .user(user)
                .title(request.getTitle())
                .primaryGoal(request.getPrimaryGoal())
                .trainingLocation(request.getTrainingLocation())
                .splitType(request.getSplitType())
                .daysPerWeek(request.getDaysPerWeek())
                .sessionDurationMins(request.getSessionDurationMins())
                .experienceLevel(request.getExperienceLevel())
                .planJson(planJson)
                .build();

        WorkoutPlan saved = workoutPlanRepository.save(entity);
        log.info("Saved workout plan '{}' with id {} for user {}", saved.getTitle(), saved.getId(), userId);

        return toResponse(saved, request.getPlanDetail());
    }

    /**
     * Retrieve all saved plans for the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<WorkoutPlanSummaryResponse> getSavedPlans() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<WorkoutPlan> entities = workoutPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return entities.stream().map(e -> WorkoutPlanSummaryResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .primaryGoal(e.getPrimaryGoal())
                .trainingLocation(e.getTrainingLocation())
                .splitType(e.getSplitType())
                .daysPerWeek(e.getDaysPerWeek())
                .sessionDurationMins(e.getSessionDurationMins())
                .experienceLevel(e.getExperienceLevel())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build()
        ).toList();
    }

    /**
     * Retrieve single plan by ID for the authenticated user.
     */
    @Transactional(readOnly = true)
    public WorkoutPlanResponse getSavedPlanById(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        WorkoutPlan entity = workoutPlanRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found or access denied"));

        WorkoutPlanDetailDto detail = parseDetailJson(entity.getPlanJson());
        return toResponse(entity, detail);
    }

    /**
     * Update an existing saved plan for the authenticated user.
     */
    @Transactional
    public WorkoutPlanResponse updateSavedPlan(UUID id, SaveWorkoutPlanRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        WorkoutPlan entity = workoutPlanRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Workout plan not found or access denied"));

        String planJson;
        try {
            planJson = objectMapper.writeValueAsString(request.getPlanDetail());
        } catch (Exception e) {
            log.error("Failed to serialize WorkoutPlanDetailDto: {}", e.getMessage());
            planJson = entity.getPlanJson();
        }

        entity.setTitle(request.getTitle());
        entity.setPrimaryGoal(request.getPrimaryGoal());
        entity.setTrainingLocation(request.getTrainingLocation());
        entity.setSplitType(request.getSplitType());
        entity.setDaysPerWeek(request.getDaysPerWeek());
        entity.setSessionDurationMins(request.getSessionDurationMins());
        entity.setExperienceLevel(request.getExperienceLevel());
        entity.setPlanJson(planJson);

        WorkoutPlan updated = workoutPlanRepository.save(entity);
        return toResponse(updated, request.getPlanDetail());
    }

    /**
     * Delete a saved plan for the authenticated user.
     */
    @Transactional
    public void deleteSavedPlan(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        workoutPlanRepository.deleteByIdAndUserId(id, userId);
        log.info("Deleted workout plan {} for user {}", id, userId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Internal Helper Methods
    // ─────────────────────────────────────────────────────────────────────────────

    private String buildPrompt(WorkoutPlanGenerateRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an elite certified strength & conditioning specialist (CSCS) and biomechanics expert. ");
        sb.append("Generate a comprehensive, scientifically sound, structured weekly workout plan in strict JSON format.\n\n");

        sb.append("USER PROFILE & CONSTRAINTS:\n");
        sb.append("- Primary Goal: ").append(req.getPrimaryGoal()).append("\n");
        if (req.getSecondaryGoal() != null) {
            sb.append("- Secondary Goal: ").append(req.getSecondaryGoal()).append("\n");
        }
        sb.append("- Experience Level: ").append(req.getExperienceLevel()).append("\n");
        sb.append("- Location: ").append(req.getTrainingLocation()).append("\n");
        sb.append("- Days Per Week: ").append(req.getDaysPerWeek()).append("\n");
        sb.append("- Preferred Split: ").append(req.getSplitType()).append("\n");
        sb.append("- Target Session Duration: ").append(req.getSessionDurationMins()).append(" minutes\n");

        if (req.getTargetMuscleGroups() != null && !req.getTargetMuscleGroups().isEmpty()) {
            sb.append("- Emphasized Muscle Groups: ").append(String.join(", ", req.getTargetMuscleGroups())).append("\n");
        }
        if (req.getAvailableEquipment() != null && !req.getAvailableEquipment().isEmpty()) {
            sb.append("- Available Equipment ONLY: ").append(String.join(", ", req.getAvailableEquipment())).append("\n");
        } else {
            sb.append("- Available Equipment: ").append(req.getTrainingLocation() == TrainingLocation.HOME ? "Bodyweight, Minimal household equipment" : "Full commercial gym equipment").append("\n");
        }
        if (req.getEquipmentRestrictions() != null && !req.getEquipmentRestrictions().isBlank()) {
            sb.append("- Equipment Restrictions: ").append(req.getEquipmentRestrictions()).append("\n");
        }
        if (req.getExercisesToAvoid() != null && !req.getExercisesToAvoid().isEmpty()) {
            sb.append("- EXCLUDED EXERCISES (DO NOT INCLUDE): ").append(String.join(", ", req.getExercisesToAvoid())).append("\n");
        }
        if (req.getInjuriesOrLimitations() != null && !req.getInjuriesOrLimitations().isBlank()) {
            sb.append("- Physical Limitations / Injuries: ").append(req.getInjuriesOrLimitations()).append("\n");
        }
        if (req.getRecoveryPreferences() != null && !req.getRecoveryPreferences().isBlank()) {
            sb.append("- Recovery Preferences: ").append(req.getRecoveryPreferences()).append("\n");
        }

        sb.append("\nSTRICT RULES:\n");
        sb.append("1. If Location is HOME, NEVER prescribe barbells, heavy cables, or machine exercises unless the user explicitly listed them in Available Equipment.\n");
        sb.append("2. Output exactly ").append(req.getDaysPerWeek()).append(" training sessions (plus optional designated rest days to total 7 days).\n");
        sb.append("3. For every exercise, include sets (3-5), repsOrDuration (e.g. '8-12 reps' or '45s plank'), restSeconds (30-180), equipment, clear execution cues, and an alternative exercise.\n");
        sb.append("4. Emphasize requested muscle groups without overtraining or creating joint imbalances.\n");
        sb.append("5. Respond with PURE JSON matching the schema below. Do NOT include markdown code blocks, apologies, or extra conversational text.\n\n");

        sb.append("RESPONSE SCHEMA:\n");
        sb.append("{\n");
        sb.append("  \"title\": \"Program Title\",\n");
        sb.append("  \"sessions\": [\n");
        sb.append("    {\n");
        sb.append("      \"dayNumber\": 1,\n");
        sb.append("      \"dayName\": \"Day 1 - Push Focus\",\n");
        sb.append("      \"sessionTitle\": \"Chest, Shoulders & Triceps\",\n");
        sb.append("      \"isRestDay\": false,\n");
        sb.append("      \"muscleGroupsEmphasized\": [\"Chest\", \"Front Delts\", \"Triceps\"],\n");
        sb.append("      \"warmupGuidance\": \"5 mins band pull-aparts and arm circles\",\n");
        sb.append("      \"cooldownGuidance\": \"Gentle chest doorway stretch\",\n");
        sb.append("      \"exercises\": [\n");
        sb.append("        {\n");
        sb.append("          \"name\": \"Dumbbell Bench Press\",\n");
        sb.append("          \"primaryTarget\": \"Pectoralis Major\",\n");
        sb.append("          \"secondaryTargets\": [\"Triceps\", \"Anterior Deltoids\"],\n");
        sb.append("          \"sets\": 4,\n");
        sb.append("          \"repsOrDuration\": \"8-10 reps\",\n");
        sb.append("          \"restSeconds\": 90,\n");
        sb.append("          \"equipment\": \"Dumbbells, Flat Bench\",\n");
        sb.append("          \"instructions\": \"Retract scapulae, lower dumbbells until elbows reach 90 degrees, press upward.\",\n");
        sb.append("          \"alternativeExercise\": \"Push-Ups or Floor Press\"\n");
        sb.append("        }\n");
        sb.append("      ]\n");
        sb.append("    }\n");
        sb.append("  ],\n");
        sb.append("  \"progressionTips\": [\"Add 1-2 reps each week before increasing load\"],\n");
        sb.append("  \"recoveryAndDeloadTips\": [\"Take a deload week every 6-8 weeks reducing volume by 40%\"],\n");
        sb.append("  \"safetyNotes\": [\"Discontinue any exercise causing sharp joint pain\"]\n");
        sb.append("}\n");

        return sb.toString();
    }

    private WorkoutPlanDetailDto parseAiResponse(String rawJson, WorkoutPlanGenerateRequest req) {
        if (rawJson == null || rawJson.isBlank()) {
            return null;
        }

        try {
            String cleaned = rawJson.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode root = objectMapper.readTree(cleaned);
            String title = root.path("title").asText("Custom " + req.getSplitType() + " Plan");

            List<WorkoutSessionDto> sessions = new ArrayList<>();
            JsonNode sessionsNode = root.path("sessions");
            if (sessionsNode.isArray()) {
                int dayCounter = 1;
                for (JsonNode sNode : sessionsNode) {
                    int dayNumber = sNode.path("dayNumber").asInt(dayCounter++);
                    String dayName = sNode.path("dayName").asText("Day " + dayNumber);
                    String sessionTitle = sNode.path("sessionTitle").asText("Workout Session");
                    boolean isRestDay = sNode.path("isRestDay").asBoolean(false);

                    List<String> muscles = new ArrayList<>();
                    JsonNode mNode = sNode.path("muscleGroupsEmphasized");
                    if (mNode.isArray()) {
                        for (JsonNode m : mNode) muscles.add(m.asText());
                    }

                    String warmup = sNode.path("warmupGuidance").asText("Dynamic mobility warm-up 5 mins");
                    String cooldown = sNode.path("cooldownGuidance").asText("Static stretching and hydration");

                    List<WorkoutExerciseDto> exercises = new ArrayList<>();
                    JsonNode exNode = sNode.path("exercises");
                    if (exNode.isArray()) {
                        for (JsonNode e : exNode) {
                            String name = e.path("name").asText("Exercise");
                            // Safety check against exercises to avoid
                            if (req.getExercisesToAvoid() != null && req.getExercisesToAvoid().stream().anyMatch(name::equalsIgnoreCase)) {
                                continue;
                            }

                            List<String> secTargets = new ArrayList<>();
                            JsonNode secNode = e.path("secondaryTargets");
                            if (secNode.isArray()) {
                                for (JsonNode st : secNode) secTargets.add(st.asText());
                            }

                            exercises.add(WorkoutExerciseDto.builder()
                                    .name(name)
                                    .primaryTarget(e.path("primaryTarget").asText("Target Muscle"))
                                    .secondaryTargets(secTargets)
                                    .sets(Math.max(1, e.path("sets").asInt(3)))
                                    .repsOrDuration(e.path("repsOrDuration").asText("8-12 reps"))
                                    .restSeconds(Math.max(30, e.path("restSeconds").asInt(60)))
                                    .equipment(e.path("equipment").asText("Bodyweight"))
                                    .instructions(e.path("instructions").asText("Perform with controlled tempo."))
                                    .alternativeExercise(e.path("alternativeExercise").asText("Standard Push-Up / Bodyweight Squat"))
                                    .build());
                        }
                    }

                    sessions.add(WorkoutSessionDto.builder()
                            .dayNumber(dayNumber)
                            .dayName(dayName)
                            .sessionTitle(sessionTitle)
                            .isRestDay(isRestDay)
                            .muscleGroupsEmphasized(muscles)
                            .warmupGuidance(warmup)
                            .cooldownGuidance(cooldown)
                            .exercises(exercises)
                            .build());
                }
            }

            if (sessions.isEmpty()) {
                return null;
            }

            List<String> progressionTips = new ArrayList<>();
            JsonNode progNode = root.path("progressionTips");
            if (progNode.isArray()) {
                for (JsonNode p : progNode) progressionTips.add(p.asText());
            }

            List<String> recoveryTips = new ArrayList<>();
            JsonNode recNode = root.path("recoveryAndDeloadTips");
            if (recNode.isArray()) {
                for (JsonNode r : recNode) recoveryTips.add(r.asText());
            }

            Map<String, Object> assumptions = new HashMap<>();
            assumptions.put("location", req.getTrainingLocation());
            assumptions.put("goal", req.getPrimaryGoal());
            assumptions.put("daysPerWeek", req.getDaysPerWeek());
            assumptions.put("sessionDurationMins", req.getSessionDurationMins());
            assumptions.put("experienceLevel", req.getExperienceLevel());

            return WorkoutPlanDetailDto.builder()
                    .title(title)
                    .primaryGoal(req.getPrimaryGoal())
                    .trainingLocation(req.getTrainingLocation())
                    .experienceLevel(req.getExperienceLevel())
                    .splitType(req.getSplitType())
                    .daysPerWeek(req.getDaysPerWeek())
                    .sessionDurationMins(req.getSessionDurationMins())
                    .userAssumptions(assumptions)
                    .sessions(sessions)
                    .progressionTips(progressionTips.isEmpty() ? List.of("Increase load incrementally when upper rep target is achieved with good form.") : progressionTips)
                    .recoveryAndDeloadTips(recoveryTips.isEmpty() ? List.of("Prioritize 7-8 hours of sleep and adequate protein intake for tissue recovery.") : recoveryTips)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse AI workout JSON: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Deterministic, clinically vetted fallback generator ensuring the user always
     * receives a safe, valid routine tailored to their selected equipment and frequency.
     */
    private WorkoutPlanDetailDto buildDeterministicPlan(WorkoutPlanGenerateRequest req) {
        boolean isHome = req.getTrainingLocation() == TrainingLocation.HOME;
        int days = req.getDaysPerWeek();
        List<WorkoutSessionDto> sessions = new ArrayList<>();

        if (days <= 3) {
            // Full Body Routine
            for (int i = 1; i <= days; i++) {
                sessions.add(createFullBodySession(i, isHome, req.getExperienceLevel()));
            }
        } else if (days == 4) {
            // Upper / Lower Split
            sessions.add(createUpperBodySession(1, "Upper Body A (Power Focus)", isHome));
            sessions.add(createLowerBodySession(2, "Lower Body A (Quad Emphasis)", isHome));
            sessions.add(createUpperBodySession(3, "Upper Body B (Hypertrophy Focus)", isHome));
            sessions.add(createLowerBodySession(4, "Lower Body B (Posterior Chain)", isHome));
        } else {
            // Push / Pull / Legs Split
            sessions.add(createPushSession(1, isHome));
            sessions.add(createPullSession(2, isHome));
            sessions.add(createLegsSession(3, isHome));
            if (days >= 4) sessions.add(createPushSession(4, isHome));
            if (days >= 5) sessions.add(createPullSession(5, isHome));
            if (days >= 6) sessions.add(createLegsSession(6, isHome));
            if (days == 7) {
                sessions.add(WorkoutSessionDto.builder()
                        .dayNumber(7)
                        .dayName("Day 7 - Active Recovery")
                        .sessionTitle("Mobility, Core & Active Restoration")
                        .isRestDay(true)
                        .muscleGroupsEmphasized(List.of("Core", "Mobility"))
                        .warmupGuidance("10 minutes of gentle yoga or foam rolling")
                        .cooldownGuidance("Deep breathing and gentle hamstring/quad stretching")
                        .exercises(List.of(
                                WorkoutExerciseDto.builder()
                                        .name("Bird Dog & Deadbug Combo")
                                        .primaryTarget("Core Stability")
                                        .secondaryTargets(List.of("Lower Back", "Glutes"))
                                        .sets(3)
                                        .repsOrDuration("10 reps/side")
                                        .restSeconds(45)
                                        .equipment("Mat")
                                        .instructions("Maintain neutral spine and breathe steadily throughout.")
                                        .alternativeExercise("Plank Hold")
                                        .build()
                        ))
                        .build());
            }
        }

        Map<String, Object> assumptions = new HashMap<>();
        assumptions.put("location", req.getTrainingLocation());
        assumptions.put("goal", req.getPrimaryGoal());
        assumptions.put("daysPerWeek", req.getDaysPerWeek());
        assumptions.put("experienceLevel", req.getExperienceLevel());

        return WorkoutPlanDetailDto.builder()
                .title("Personalized " + req.getSplitType() + " Routine")
                .primaryGoal(req.getPrimaryGoal())
                .trainingLocation(req.getTrainingLocation())
                .experienceLevel(req.getExperienceLevel())
                .splitType(req.getSplitType())
                .daysPerWeek(req.getDaysPerWeek())
                .sessionDurationMins(req.getSessionDurationMins())
                .userAssumptions(assumptions)
                .sessions(sessions)
                .progressionTips(List.of(
                        "Double Progression Rule: Aim for upper rep limit before increasing weight by 2.5–5%.",
                        "Track working sets consistently and maintain a log of weights used."
                ))
                .recoveryAndDeloadTips(List.of(
                        "Plan a deload week every 6 to 8 weeks by reducing sets by half.",
                        "Aim for 2.0g protein per kg of bodyweight and 2.5L+ hydration daily."
                ))
                .build();
    }

    private WorkoutSessionDto createFullBodySession(int day, boolean isHome, ExperienceLevel level) {
        List<WorkoutExerciseDto> ex = new ArrayList<>();
        if (isHome) {
            ex.add(WorkoutExerciseDto.builder()
                    .name("Goblet Squats or Bodyweight Squats")
                    .primaryTarget("Quadriceps")
                    .secondaryTargets(List.of("Glutes", "Core"))
                    .sets(3)
                    .repsOrDuration("10-15 reps")
                    .restSeconds(60)
                    .equipment("Dumbbell or Bodyweight")
                    .instructions("Descend until thighs are parallel to floor, keeping chest proud.")
                    .alternativeExercise("Reverse Lunges")
                    .build());
            ex.add(WorkoutExerciseDto.builder()
                    .name("Push-Ups or Incline Push-Ups")
                    .primaryTarget("Chest")
                    .secondaryTargets(List.of("Triceps", "Front Delts"))
                    .sets(3)
                    .repsOrDuration("8-12 reps")
                    .restSeconds(60)
                    .equipment("Floor / Elevate hands if needed")
                    .instructions("Maintain tight plank alignment, tuck elbows at 45 degrees.")
                    .alternativeExercise("Floor Dumbbell Press")
                    .build());
            ex.add(WorkoutExerciseDto.builder()
                    .name("Dumbbell / Resistance Band Rows")
                    .primaryTarget("Latissimus Dorsi")
                    .secondaryTargets(List.of("Rhomboids", "Biceps"))
                    .sets(3)
                    .repsOrDuration("10-12 reps")
                    .restSeconds(60)
                    .equipment("Dumbbells or Band")
                    .instructions("Hinge at hips, pull elbows toward hips and squeeze shoulder blades.")
                    .alternativeExercise("Doorframe Inverted Rows")
                    .build());
        } else {
            ex.add(WorkoutExerciseDto.builder()
                    .name("Barbell Back Squat / Leg Press")
                    .primaryTarget("Quadriceps")
                    .secondaryTargets(List.of("Glutes", "Adductors"))
                    .sets(4)
                    .repsOrDuration("8-10 reps")
                    .restSeconds(90)
                    .equipment("Squat Rack or Leg Press Machine")
                    .instructions("Brace core, descend with control, drive through mid-foot.")
                    .alternativeExercise("Dumbbell Bulgarian Split Squat")
                    .build());
            ex.add(WorkoutExerciseDto.builder()
                    .name("Barbell / Dumbbell Bench Press")
                    .primaryTarget("Chest")
                    .secondaryTargets(List.of("Triceps", "Shoulders"))
                    .sets(4)
                    .repsOrDuration("8-10 reps")
                    .restSeconds(90)
                    .equipment("Flat Bench & Barbell / Dumbbells")
                    .instructions("Squeeze shoulder blades together, lower bar to mid-chest, drive up.")
                    .alternativeExercise("Dumbbell Flat Press")
                    .build());
            ex.add(WorkoutExerciseDto.builder()
                    .name("Seated Cable Row / Lat Pulldown")
                    .primaryTarget("Upper Back & Lats")
                    .secondaryTargets(List.of("Biceps", "Rear Delts"))
                    .sets(3)
                    .repsOrDuration("10-12 reps")
                    .restSeconds(75)
                    .equipment("Cable Machine")
                    .instructions("Lead with elbows, pause 1 second at peak contraction.")
                    .alternativeExercise("Chest-Supported Machine Row")
                    .build());
        }

        return WorkoutSessionDto.builder()
                .dayNumber(day)
                .dayName("Day " + day + " - Full Body Balance")
                .sessionTitle("Compound Full Body Conditioning")
                .isRestDay(false)
                .muscleGroupsEmphasized(List.of("Legs", "Chest", "Back", "Core"))
                .warmupGuidance("5 minutes arm circles, leg swings, and bodyweight squats")
                .cooldownGuidance("Cat-cow stretch and hip flexor kneeling stretch")
                .exercises(ex)
                .build();
    }

    private WorkoutSessionDto createUpperBodySession(int day, String title, boolean isHome) {
        List<WorkoutExerciseDto> ex = new ArrayList<>();
        ex.add(WorkoutExerciseDto.builder()
                .name(isHome ? "Push-Ups / Dumbbell Floor Press" : "Barbell Bench Press")
                .primaryTarget("Chest")
                .secondaryTargets(List.of("Triceps", "Anterior Deltoid"))
                .sets(4)
                .repsOrDuration("8-10 reps")
                .restSeconds(75)
                .equipment(isHome ? "Dumbbells / Floor" : "Bench & Barbell")
                .instructions("Keep wrists stacked over elbows, control lowering phase.")
                .alternativeExercise("Incline Dumbbell Press")
                .build());
        ex.add(WorkoutExerciseDto.builder()
                .name(isHome ? "Bent-Over Dumbbell Rows" : "Barbell Bent-Over Row")
                .primaryTarget("Back & Lats")
                .secondaryTargets(List.of("Biceps", "Rear Delts"))
                .sets(4)
                .repsOrDuration("8-12 reps")
                .restSeconds(75)
                .equipment(isHome ? "Dumbbells" : "Barbell & Plates")
                .instructions("Hinge hips back at 45 degrees, pull toward navel.")
                .alternativeExercise("Single-Arm Dumbbell Row")
                .build());
        ex.add(WorkoutExerciseDto.builder()
                .name("Dumbbell Overhead Shoulder Press")
                .primaryTarget("Shoulders (Deltoids)")
                .secondaryTargets(List.of("Triceps", "Upper Trapezius"))
                .sets(3)
                .repsOrDuration("10-12 reps")
                .restSeconds(60)
                .equipment(isHome ? "Dumbbells" : "Dumbbells / Cable Machine")
                .instructions("Press dumbbells overhead without hyperextending lower back.")
                .alternativeExercise("Pike Push-Ups")
                .build());

        return WorkoutSessionDto.builder()
                .dayNumber(day)
                .dayName("Day " + day + " - Upper Body")
                .sessionTitle(title)
                .isRestDay(false)
                .muscleGroupsEmphasized(List.of("Chest", "Back", "Shoulders", "Arms"))
                .warmupGuidance("Dynamic shoulder dislocates with band or light towel")
                .cooldownGuidance("Cross-body shoulder and lat doorway stretch")
                .exercises(ex)
                .build();
    }

    private WorkoutSessionDto createLowerBodySession(int day, String title, boolean isHome) {
        List<WorkoutExerciseDto> ex = new ArrayList<>();
        ex.add(WorkoutExerciseDto.builder()
                .name(isHome ? "Goblet Squats / Split Squats" : "Barbell Back Squats")
                .primaryTarget("Quadriceps")
                .secondaryTargets(List.of("Glutes", "Hamstrings"))
                .sets(4)
                .repsOrDuration("8-10 reps")
                .restSeconds(90)
                .equipment(isHome ? "Dumbbell" : "Barbell & Squat Rack")
                .instructions("Drive knees outward in line with toes, maintain braced abdomen.")
                .alternativeExercise("Leg Press")
                .build());
        ex.add(WorkoutExerciseDto.builder()
                .name(isHome ? "Dumbbell Romanian Deadlift" : "Barbell Romanian Deadlift")
                .primaryTarget("Hamstrings")
                .secondaryTargets(List.of("Glutes", "Erector Spinae"))
                .sets(3)
                .repsOrDuration("10-12 reps")
                .restSeconds(75)
                .equipment(isHome ? "Dumbbells" : "Barbell")
                .instructions("Push hips backward, feeling stretch in hamstrings before extending hips.")
                .alternativeExercise("Lying Hamstring Curls")
                .build());
        ex.add(WorkoutExerciseDto.builder()
                .name("Standing Calf Raises")
                .primaryTarget("Calves (Gastrocnemius)")
                .secondaryTargets(List.of("Soleus"))
                .sets(3)
                .repsOrDuration("15-20 reps")
                .restSeconds(45)
                .equipment("Step or Floor")
                .instructions("Pause 2 seconds at top contraction and 2 seconds at deep stretch.")
                .alternativeExercise("Seated Calf Raise")
                .build());

        return WorkoutSessionDto.builder()
                .dayNumber(day)
                .dayName("Day " + day + " - Lower Body")
                .sessionTitle(title)
                .isRestDay(false)
                .muscleGroupsEmphasized(List.of("Quads", "Hamstrings", "Glutes", "Calves"))
                .warmupGuidance("High knees, butt kicks, and bodyweight hip openers")
                .cooldownGuidance("Kneeling hip flexor and standing quad stretch")
                .exercises(ex)
                .build();
    }

    private WorkoutSessionDto createPushSession(int day, boolean isHome) {
        return createUpperBodySession(day, "Push Session (Chest, Shoulders & Triceps)", isHome);
    }

    private WorkoutSessionDto createPullSession(int day, boolean isHome) {
        List<WorkoutExerciseDto> ex = new ArrayList<>();
        ex.add(WorkoutExerciseDto.builder()
                .name(isHome ? "Dumbbell Rows / Band Pull-Downs" : "Lat Pulldown / Pull-Ups")
                .primaryTarget("Lats")
                .secondaryTargets(List.of("Biceps", "Upper Back"))
                .sets(4)
                .repsOrDuration("8-12 reps")
                .restSeconds(75)
                .equipment(isHome ? "Dumbbells" : "Lat Pulldown Machine / Bar")
                .instructions("Pull bar toward upper chest, driving elbows downward.")
                .alternativeExercise("Inverted Rows")
                .build());
        ex.add(WorkoutExerciseDto.builder()
                .name("Dumbbell Bicep Curls")
                .primaryTarget("Biceps Brachii")
                .secondaryTargets(List.of("Brachialis", "Forearms"))
                .sets(3)
                .repsOrDuration("10-12 reps")
                .restSeconds(60)
                .equipment("Dumbbells")
                .instructions("Keep upper arms pinned to sides, curl with supination.")
                .alternativeExercise("Hammer Curls")
                .build());

        return WorkoutSessionDto.builder()
                .dayNumber(day)
                .dayName("Day " + day + " - Pull")
                .sessionTitle("Pull Session (Back & Biceps)")
                .isRestDay(false)
                .muscleGroupsEmphasized(List.of("Lats", "Rhomboids", "Biceps", "Rear Delts"))
                .warmupGuidance("Band pull-aparts and dead hangs for 30s")
                .cooldownGuidance("Lat doorway stretch and forearm extension stretch")
                .exercises(ex)
                .build();
    }

    private WorkoutSessionDto createLegsSession(int day, boolean isHome) {
        return createLowerBodySession(day, "Legs & Core Session", isHome);
    }

    private WorkoutPlanResponse toResponse(WorkoutPlan entity, WorkoutPlanDetailDto detail) {
        return WorkoutPlanResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .primaryGoal(entity.getPrimaryGoal())
                .trainingLocation(entity.getTrainingLocation())
                .splitType(entity.getSplitType())
                .daysPerWeek(entity.getDaysPerWeek())
                .sessionDurationMins(entity.getSessionDurationMins())
                .experienceLevel(entity.getExperienceLevel())
                .planDetail(detail)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private WorkoutPlanDetailDto parseDetailJson(String planJson) {
        if (planJson == null || planJson.isBlank()) {
            return WorkoutPlanDetailDto.builder().build();
        }
        try {
            return objectMapper.readValue(planJson, WorkoutPlanDetailDto.class);
        } catch (Exception e) {
            log.warn("Failed to deserialize WorkoutPlanDetailDto: {}", e.getMessage());
            return WorkoutPlanDetailDto.builder().build();
        }
    }
}
