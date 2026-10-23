package com.prota.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.DietPlanGenerateRequest;
import com.prota.dto.request.SaveDietPlanRequest;
import com.prota.dto.response.*;
import com.prota.entity.DietPlan;
import com.prota.entity.User;
import com.prota.entity.enums.DietGoal;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.DietPlanRepository;
import com.prota.repo.UserRepository;
import com.prota.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class DietPlanService {

    private static final Logger log = LoggerFactory.getLogger(DietPlanService.class);

    private final GeminiClient geminiClient;
    private final DietPlanRepository dietPlanRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public DietPlanService(
            GeminiClient geminiClient,
            DietPlanRepository dietPlanRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.dietPlanRepository = dietPlanRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Deterministically calculates caloric and macro targets, then calls Gemini
     * to generate a structured meal plan adhering to user preferences and safety rules.
     */
    public DietPlanDetailDto generatePlan(DietPlanGenerateRequest request) {
        // 1. Calculate BMR using Mifflin-St Jeor formula
        double weight = request.getCurrentWeightKg().doubleValue();
        double height = request.getHeightCm().doubleValue();
        int age = request.getAge();
        String gender = request.getGender() != null ? request.getGender().trim().toUpperCase() : "OTHER";

        double bmr;
        if ("MALE".equals(gender)) {
            bmr = 10.0 * weight + 6.25 * height - 5.0 * age + 5.0;
        } else if ("FEMALE".equals(gender)) {
            bmr = 10.0 * weight + 6.25 * height - 5.0 * age - 161.0;
        } else {
            // Neutral average
            bmr = 10.0 * weight + 6.25 * height - 5.0 * age - 78.0;
        }

        // 2. Physical activity multiplier -> TDEE
        double activityMultiplier = switch (request.getActivityLevel() != null ? request.getActivityLevel().toUpperCase() : "LIGHTLY_ACTIVE") {
            case "SEDENTARY" -> 1.20;
            case "LIGHTLY_ACTIVE" -> 1.375;
            case "MODERATELY_ACTIVE" -> 1.55;
            case "VERY_ACTIVE" -> 1.725;
            case "EXTRA_ACTIVE" -> 1.90;
            default -> 1.375;
        };
        double tdee = bmr * activityMultiplier;

        // 3. Goal Adjustment & Safety Bounds
        DietGoal goal = request.getGoal();
        double targetCalories;
        List<String> safetyNotes = new ArrayList<>();

        if (goal == DietGoal.FAT_LOSS) {
            double deficit = 400.0;
            targetCalories = tdee - deficit;

            // Safe clinical floors: 1200 kcal for female/other, 1500 kcal for male
            double minSafe = "MALE".equals(gender) ? 1500.0 : 1200.0;
            if (targetCalories < minSafe) {
                targetCalories = minSafe;
                safetyNotes.add(String.format("Calculated deficit was adjusted to the safe clinical floor of %d kcal/day to prevent metabolic slowdown.", (int) minSafe));
            }

            // Timeline check
            if (request.getTargetWeightKg() != null && request.getTimeframeWeeks() != null && request.getTimeframeWeeks() > 0) {
                double diff = weight - request.getTargetWeightKg().doubleValue();
                if (diff > 0) {
                    double weeklyLoss = diff / request.getTimeframeWeeks();
                    if (weeklyLoss > 1.0) {
                        safetyNotes.add(String.format("Losing %.1f kg/week exceeds the clinically recommended rate (0.5 - 1.0 kg/week). Calorie targets have been calculated with a safe, sustainable deficit.", weeklyLoss));
                    }
                }
            }
        } else if (goal == DietGoal.MUSCLE_GAIN) {
            targetCalories = tdee + 300.0; // Moderate, clean surplus
        } else {
            // WEIGHT_MAINTENANCE or GENERAL_FITNESS
            targetCalories = tdee;
        }

        BigDecimal dailyCalories = BigDecimal.valueOf(Math.round(targetCalories)).setScale(2, RoundingMode.HALF_UP);

        // 4. Macro targets
        double proteinMultiplier = (goal == DietGoal.FAT_LOSS || goal == DietGoal.MUSCLE_GAIN) ? 2.0 : 1.6;
        double proteinG = Math.round(weight * proteinMultiplier);
        // Ensure within healthy bounds
        proteinG = Math.max(50.0, Math.min(260.0, proteinG));

        double fatG = Math.round((targetCalories * 0.25) / 9.0);
        fatG = Math.max(30.0, Math.min(130.0, fatG));

        double carbCalories = targetCalories - (proteinG * 4.0 + fatG * 9.0);
        double carbsG = Math.round(Math.max(40.0, carbCalories / 4.0));

        BigDecimal dailyProtein = BigDecimal.valueOf(proteinG).setScale(2, RoundingMode.HALF_UP);
        BigDecimal dailyCarbs = BigDecimal.valueOf(carbsG).setScale(2, RoundingMode.HALF_UP);
        BigDecimal dailyFat = BigDecimal.valueOf(fatG).setScale(2, RoundingMode.HALF_UP);

        if (request.getMedicalConditionsOrNotes() != null && !request.getMedicalConditionsOrNotes().isBlank()) {
            safetyNotes.add("Noted user health considerations: " + request.getMedicalConditionsOrNotes().trim());
        }

        // 5. Build prompt for Gemini
        int mealsCount = request.getMealFrequency() != null ? request.getMealFrequency() : 3;
        String dietType = request.getDietaryPreference() != null ? request.getDietaryPreference() : "Omnivore";
        String cuisine = request.getPreferredCuisine() != null && !request.getPreferredCuisine().isBlank() ? request.getPreferredCuisine() : "Balanced International / Indian";
        String allergiesStr = (request.getAllergies() != null && !request.getAllergies().isEmpty())
                ? String.join(", ", request.getAllergies()) : "None declared";
        String dislikedStr = (request.getDislikedFoods() != null && !request.getDislikedFoods().isEmpty())
                ? String.join(", ", request.getDislikedFoods()) : "None declared";
        String budget = request.getBudget() != null ? request.getBudget() : "Moderate";
        String cookingTime = request.getCookingTime() != null ? request.getCookingTime() : "30 minutes";

        String prompt = String.format("""
                You are a certified sports nutritionist creating a personalized, practical meal schedule.
                GOAL: %s
                DAILY TARGETS: %s kcal, %s g Protein, %s g Carbs, %s g Fat
                MEAL FREQUENCY: %d meals per day
                DIETARY PREFERENCE: %s
                PREFERRED CUISINE: %s
                BUDGET: %s, COOKING TIME: %s

                CRITICAL ALLERGY RESTRICTIONS (DO NOT INCLUDE ANY OF THESE INGREDIENTS OR DERIVATIVES):
                %s

                DISLIKED FOODS (AVOID THESE):
                %s

                Generate a complete, delicious 1-day meal schedule matching the meal frequency and macro targets closely.
                Prioritize accessible, wholesome foods. Ensure realistic portion sizes.
                Include 2-3 practical food substitutions, a categorized grocery shopping list, 2-3 meal prep tips, and daily hydration guidance.

                Respond with valid JSON only conforming exactly to this structure:
                {
                  "meals": [
                    {
                      "mealName": "Breakfast",
                      "timing": "8:00 AM",
                      "foods": [
                        {
                          "name": "Oatmeal with Almond Milk & Berries",
                          "quantity": 1.0,
                          "quantityUnit": "bowl",
                          "proteinG": 12.0,
                          "caloriesKcal": 320.0,
                          "carbohydratesG": 48.0,
                          "fatG": 8.0,
                          "notes": "Top with 1 tbsp chia seeds"
                        }
                      ],
                      "totalCaloriesKcal": 320.0,
                      "totalProteinG": 12.0,
                      "totalCarbohydratesG": 48.0,
                      "totalFatG": 8.0
                    }
                  ],
                  "practicalSubstitutions": [
                    {
                      "originalFood": "Paneer / Tofu",
                      "alternativeFood": "Greek Yogurt or Boiled Chickpeas",
                      "notes": "Similar protein density"
                    }
                  ],
                  "shoppingList": [
                    {
                      "category": "Proteins & Dairy",
                      "items": ["Rolled Oats", "Almond Milk", "Chia Seeds"]
                    }
                  ],
                  "mealPrepTips": [
                    "Soak oats or cook grains in advance for quick morning assembly."
                  ],
                  "hydrationGuidance": "Drink 2.5 - 3.5 liters of clean water throughout the day."
                }
                """,
                goal.name(), dailyCalories, dailyProtein, dailyCarbs, dailyFat,
                mealsCount, dietType, cuisine, budget, cookingTime,
                allergiesStr, dislikedStr);

        // 6. Execute Gemini structured request
        String rawJson = geminiClient.generateStructuredTextEstimate(prompt);

        // 7. Parse response defensive
        ParsedPlan parsed = parsePlanJson(rawJson);

        // 8. Construct user assumptions snapshot
        Map<String, Object> assumptions = new LinkedHashMap<>();
        assumptions.put("age", age);
        assumptions.put("gender", gender);
        assumptions.put("heightCm", height);
        assumptions.put("currentWeightKg", weight);
        if (request.getTargetWeightKg() != null) assumptions.put("targetWeightKg", request.getTargetWeightKg());
        assumptions.put("activityLevel", request.getActivityLevel());
        assumptions.put("dietaryPreference", dietType);
        assumptions.put("preferredCuisine", cuisine);
        assumptions.put("mealFrequency", mealsCount);
        if (request.getAllergies() != null && !request.getAllergies().isEmpty()) {
            assumptions.put("allergies", request.getAllergies());
        }

        String planTitle = String.format("%s Plan (%s kcal)", formatGoalName(goal), dailyCalories.intValue());

        return DietPlanDetailDto.builder()
                .title(planTitle)
                .goal(goal)
                .creationDate(LocalDate.now().toString())
                .userAssumptions(assumptions)
                .dailyCaloriesKcal(dailyCalories)
                .dailyProteinG(dailyProtein)
                .dailyCarbohydratesG(dailyCarbs)
                .dailyFatG(dailyFat)
                .meals(parsed.meals)
                .practicalSubstitutions(parsed.substitutions)
                .shoppingList(parsed.shoppingList)
                .mealPrepTips(parsed.mealPrepTips)
                .hydrationGuidance(parsed.hydrationGuidance != null ? parsed.hydrationGuidance : "Drink 2.5 - 3.5 L of water daily.")
                .safetyNotes(safetyNotes)
                .disclaimer("This generated diet plan is for general wellness, fitness, and nutritional guidance only. It is not clinical medical advice. Individuals with underlying medical conditions, metabolic disorders, or pregnancy should consult a physician or registered dietitian.")
                .build();
    }

    @Transactional
    public DietPlanResponse savePlan(SaveDietPlanRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String planJson;
        try {
            planJson = objectMapper.writeValueAsString(request.getPlanDetail());
        } catch (Exception e) {
            log.error("Failed to serialize diet plan detail: {}", e.getMessage());
            planJson = "{}";
        }

        DietPlan dietPlan = DietPlan.builder()
                .user(user)
                .title(request.getTitle().trim())
                .goal(request.getGoal())
                .dailyCaloriesKcal(request.getDailyCaloriesKcal().setScale(2, RoundingMode.HALF_UP))
                .dailyProteinG(request.getDailyProteinG().setScale(2, RoundingMode.HALF_UP))
                .dailyCarbohydratesG(request.getDailyCarbohydratesG() != null ? request.getDailyCarbohydratesG().setScale(2, RoundingMode.HALF_UP) : null)
                .dailyFatG(request.getDailyFatG() != null ? request.getDailyFatG().setScale(2, RoundingMode.HALF_UP) : null)
                .planJson(planJson)
                .build();

        DietPlan saved = dietPlanRepository.save(dietPlan);

        return toResponse(saved, request.getPlanDetail());
    }

    @Transactional(readOnly = true)
    public List<DietPlanSummaryResponse> getSavedPlans() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<DietPlan> plans = dietPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return plans.stream()
                .map(p -> DietPlanSummaryResponse.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .goal(p.getGoal())
                        .dailyCaloriesKcal(p.getDailyCaloriesKcal())
                        .dailyProteinG(p.getDailyProteinG())
                        .dailyCarbohydratesG(p.getDailyCarbohydratesG())
                        .dailyFatG(p.getDailyFatG())
                        .createdAt(p.getCreatedAt())
                        .updatedAt(p.getUpdatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public DietPlanResponse getSavedPlanById(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        DietPlan plan = dietPlanRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Diet plan not found"));

        DietPlanDetailDto detail = parseDetailJson(plan.getPlanJson());
        return toResponse(plan, detail);
    }

    @Transactional
    public void deleteSavedPlan(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        DietPlan plan = dietPlanRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Diet plan not found"));
        dietPlanRepository.delete(plan);
    }

    private DietPlanResponse toResponse(DietPlan plan, DietPlanDetailDto detail) {
        return DietPlanResponse.builder()
                .id(plan.getId())
                .title(plan.getTitle())
                .goal(plan.getGoal())
                .dailyCaloriesKcal(plan.getDailyCaloriesKcal())
                .dailyProteinG(plan.getDailyProteinG())
                .dailyCarbohydratesG(plan.getDailyCarbohydratesG())
                .dailyFatG(plan.getDailyFatG())
                .planDetail(detail)
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }

    private String formatGoalName(DietGoal goal) {
        return switch (goal) {
            case MUSCLE_GAIN -> "Muscle Gain";
            case FAT_LOSS -> "Fat Loss";
            case WEIGHT_MAINTENANCE -> "Maintenance";
            case GENERAL_FITNESS -> "General Fitness";
        };
    }

    private static class ParsedPlan {
        List<DietPlanMealDto> meals = new ArrayList<>();
        List<DietPlanSubstitutionDto> substitutions = new ArrayList<>();
        List<DietPlanShoppingCategoryDto> shoppingList = new ArrayList<>();
        List<String> mealPrepTips = new ArrayList<>();
        String hydrationGuidance;
    }

    private ParsedPlan parsePlanJson(String rawJson) {
        ParsedPlan result = new ParsedPlan();
        if (rawJson == null || rawJson.isBlank()) return result;

        try {
            String clean = rawJson.trim();
            if (clean.startsWith("```json")) clean = clean.substring(7);
            else if (clean.startsWith("```")) clean = clean.substring(3);
            if (clean.endsWith("```")) clean = clean.substring(0, clean.length() - 3);
            clean = clean.trim();

            JsonNode root = objectMapper.readTree(clean);

            // 1. Meals
            JsonNode mealsNode = root.path("meals");
            if (mealsNode.isArray()) {
                for (JsonNode mNode : mealsNode) {
                    String mealName = mNode.path("mealName").asText("Meal");
                    String timing = mNode.path("timing").asText("");

                    List<DietPlanMealFoodDto> foods = new ArrayList<>();
                    JsonNode foodsNode = mNode.path("foods");
                    double sumCal = 0, sumP = 0, sumC = 0, sumF = 0;

                    if (foodsNode.isArray()) {
                        for (JsonNode fNode : foodsNode) {
                            String fName = fNode.path("name").asText("Food Item");
                            BigDecimal qty = BigDecimal.valueOf(Math.max(0.1, fNode.path("quantity").asDouble(1.0))).setScale(2, RoundingMode.HALF_UP);
                            String unit = fNode.path("quantityUnit").asText("serving");
                            BigDecimal p = BigDecimal.valueOf(Math.max(0.0, fNode.path("proteinG").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal cal = BigDecimal.valueOf(Math.max(0.0, fNode.path("caloriesKcal").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal c = BigDecimal.valueOf(Math.max(0.0, fNode.path("carbohydratesG").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal f = BigDecimal.valueOf(Math.max(0.0, fNode.path("fatG").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP);
                            String notes = fNode.hasNonNull("notes") ? fNode.path("notes").asText() : null;

                            sumCal += cal.doubleValue();
                            sumP += p.doubleValue();
                            sumC += c.doubleValue();
                            sumF += f.doubleValue();

                            foods.add(DietPlanMealFoodDto.builder()
                                    .name(fName)
                                    .quantity(qty)
                                    .quantityUnit(unit)
                                    .proteinG(p)
                                    .caloriesKcal(cal)
                                    .carbohydratesG(c)
                                    .fatG(f)
                                    .notes(notes)
                                    .build());
                        }
                    }

                    BigDecimal mealCal = mNode.hasNonNull("totalCaloriesKcal")
                            ? BigDecimal.valueOf(mNode.path("totalCaloriesKcal").asDouble()).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.valueOf(sumCal).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal mealP = mNode.hasNonNull("totalProteinG")
                            ? BigDecimal.valueOf(mNode.path("totalProteinG").asDouble()).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.valueOf(sumP).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal mealC = mNode.hasNonNull("totalCarbohydratesG")
                            ? BigDecimal.valueOf(mNode.path("totalCarbohydratesG").asDouble()).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.valueOf(sumC).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal mealF = mNode.hasNonNull("totalFatG")
                            ? BigDecimal.valueOf(mNode.path("totalFatG").asDouble()).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.valueOf(sumF).setScale(2, RoundingMode.HALF_UP);

                    result.meals.add(DietPlanMealDto.builder()
                            .mealName(mealName)
                            .timing(timing)
                            .foods(foods)
                            .totalCaloriesKcal(mealCal)
                            .totalProteinG(mealP)
                            .totalCarbohydratesG(mealC)
                            .totalFatG(mealF)
                            .build());
                }
            }

            // 2. Substitutions
            JsonNode subsNode = root.path("practicalSubstitutions");
            if (subsNode.isArray()) {
                for (JsonNode sNode : subsNode) {
                    result.substitutions.add(DietPlanSubstitutionDto.builder()
                            .originalFood(sNode.path("originalFood").asText(""))
                            .alternativeFood(sNode.path("alternativeFood").asText(""))
                            .notes(sNode.path("notes").asText(""))
                            .build());
                }
            }

            // 3. Shopping list
            JsonNode shopNode = root.path("shoppingList");
            if (shopNode.isArray()) {
                for (JsonNode catNode : shopNode) {
                    String catName = catNode.path("category").asText("Groceries");
                    List<String> items = new ArrayList<>();
                    JsonNode itemsNode = catNode.path("items");
                    if (itemsNode.isArray()) {
                        for (JsonNode iNode : itemsNode) {
                            items.add(iNode.asText(""));
                        }
                    }
                    result.shoppingList.add(DietPlanShoppingCategoryDto.builder()
                            .category(catName)
                            .items(items)
                            .build());
                }
            }

            // 4. Meal prep tips
            JsonNode tipsNode = root.path("mealPrepTips");
            if (tipsNode.isArray()) {
                for (JsonNode tNode : tipsNode) {
                    result.mealPrepTips.add(tNode.asText(""));
                }
            }

            // 5. Hydration
            result.hydrationGuidance = root.path("hydrationGuidance").asText(null);

        } catch (Exception e) {
            log.warn("Failed to parse diet plan JSON from AI: {}", e.getMessage());
        }

        return result;
    }

    private DietPlanDetailDto parseDetailJson(String planJson) {
        if (planJson == null || planJson.isBlank()) {
            return DietPlanDetailDto.builder().build();
        }
        try {
            return objectMapper.readValue(planJson, DietPlanDetailDto.class);
        } catch (Exception e) {
            log.warn("Failed to deserialize DietPlanDetailDto: {}", e.getMessage());
            return DietPlanDetailDto.builder().build();
        }
    }
}
