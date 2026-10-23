package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.ai.client.GeminiClient;
import com.prota.dto.request.RegisterRequest;
import com.prota.dto.request.SaveWorkoutPlanRequest;
import com.prota.dto.request.WorkoutPlanGenerateRequest;
import com.prota.dto.response.WorkoutExerciseDto;
import com.prota.dto.response.WorkoutPlanDetailDto;
import com.prota.dto.response.WorkoutSessionDto;
import com.prota.entity.enums.ExperienceLevel;
import com.prota.entity.enums.SplitType;
import com.prota.entity.enums.TrainingLocation;
import com.prota.entity.enums.WorkoutGoal;
import com.prota.repo.WorkoutPlanRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase6BWorkoutPlannerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WorkoutPlanRepository workoutPlanRepository;

    @MockitoBean
    private GeminiClient geminiClient;

    private MockHttpSession registerUser(String email, String password, String fullName) throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .fullName(fullName)
                .email(email)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return (MockHttpSession) result.getRequest().getSession();
    }

    private String sampleGeminiWorkoutJson() {
        return """
                {
                  "title": "Hypertrophy Push/Pull/Legs Split",
                  "sessions": [
                    {
                      "dayNumber": 1,
                      "dayName": "Day 1 - Push Focus",
                      "sessionTitle": "Chest, Front Delts & Triceps",
                      "isRestDay": false,
                      "muscleGroupsEmphasized": ["Chest", "Front Delts", "Triceps"],
                      "warmupGuidance": "5 mins arm swings and push-up walkouts",
                      "cooldownGuidance": "Pectoral doorway stretch and overhead tricep stretch",
                      "exercises": [
                        {
                          "name": "Dumbbell Bench Press",
                          "primaryTarget": "Chest",
                          "secondaryTargets": ["Triceps", "Front Delts"],
                          "sets": 4,
                          "repsOrDuration": "8-12 reps",
                          "restSeconds": 90,
                          "equipment": "Dumbbells, Bench",
                          "instructions": "Lower dumbbells under control, drive up through chest.",
                          "alternativeExercise": "Push-Ups"
                        },
                        {
                          "name": "Dumbbell Lateral Raises",
                          "primaryTarget": "Side Delts",
                          "secondaryTargets": ["Traps"],
                          "sets": 3,
                          "repsOrDuration": "12-15 reps",
                          "restSeconds": 60,
                          "equipment": "Dumbbells",
                          "instructions": "Lead with elbows, pause briefly at parallel.",
                          "alternativeExercise": "Resistance Band Lateral Raises"
                        }
                      ]
                    },
                    {
                      "dayNumber": 2,
                      "dayName": "Day 2 - Pull Focus",
                      "sessionTitle": "Upper Back & Biceps",
                      "isRestDay": false,
                      "muscleGroupsEmphasized": ["Lats", "Rhomboids", "Biceps"],
                      "warmupGuidance": "Scapular retractions and light band rows",
                      "cooldownGuidance": "Lat stretch and bicep extension stretch",
                      "exercises": [
                        {
                          "name": "Dumbbell Single-Arm Row",
                          "primaryTarget": "Lats",
                          "secondaryTargets": ["Biceps"],
                          "sets": 4,
                          "repsOrDuration": "10-12 reps",
                          "restSeconds": 75,
                          "equipment": "Dumbbell, Bench",
                          "instructions": "Pull elbow to hip without rotating torso excessively.",
                          "alternativeExercise": "Inverted Rows"
                        }
                      ]
                    },
                    {
                      "dayNumber": 3,
                      "dayName": "Day 3 - Legs Focus",
                      "sessionTitle": "Quads, Hamstrings & Glutes",
                      "isRestDay": false,
                      "muscleGroupsEmphasized": ["Quads", "Hamstrings", "Calves"],
                      "warmupGuidance": "Bodyweight squats and hip flexor stretches",
                      "cooldownGuidance": "Seated hamstring stretch",
                      "exercises": [
                        {
                          "name": "Goblet Squats",
                          "primaryTarget": "Quads",
                          "secondaryTargets": ["Glutes"],
                          "sets": 4,
                          "repsOrDuration": "10-12 reps",
                          "restSeconds": 90,
                          "equipment": "Dumbbell",
                          "instructions": "Sit between hips, push knees out, keep torso upright.",
                          "alternativeExercise": "Bodyweight Squats"
                        }
                      ]
                    }
                  ],
                  "progressionTips": ["Add 1 rep per set each week before increasing dumbbell weight."],
                  "recoveryAndDeloadTips": ["Take a full rest day after legs session."],
                  "safetyNotes": ["Keep neutral spine on all rows and squats."]
                }
                """;
    }

    @Test
    @DisplayName("Generate Workout Plan: Success with Gemini structured JSON output")
    void testGenerateWorkoutPlan_SuccessWithMockGemini() throws Exception {
        MockHttpSession session = registerUser("trainer1-" + UUID.randomUUID() + "@example.com", "Password123!", "Coach Alex");

        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.generateStructuredTextEstimate(anyString())).thenReturn(sampleGeminiWorkoutJson());

        WorkoutPlanGenerateRequest request = WorkoutPlanGenerateRequest.builder()
                .age(28)
                .heightCm(178.0)
                .weightKg(75.0)
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .primaryGoal(WorkoutGoal.MUSCLE_HYPERTROPHY)
                .trainingLocation(TrainingLocation.HOME)
                .availableEquipment(List.of("Dumbbells", "Bench", "Pull-up Bar"))
                .daysPerWeek(3)
                .splitType(SplitType.PUSH_PULL_LEGS)
                .sessionDurationMins(60)
                .targetMuscleGroups(List.of("Chest", "Back", "Legs"))
                .injuriesOrLimitations("Minor lower back tightness")
                .build();

        mockMvc.perform(post("/workout-plans/generate")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Hypertrophy Push/Pull/Legs Split"))
                .andExpect(jsonPath("$.primaryGoal").value("MUSCLE_HYPERTROPHY"))
                .andExpect(jsonPath("$.trainingLocation").value("HOME"))
                .andExpect(jsonPath("$.daysPerWeek").value(3))
                .andExpect(jsonPath("$.sessions", hasSize(3)))
                .andExpect(jsonPath("$.sessions[0].sessionTitle").value("Chest, Front Delts & Triceps"))
                .andExpect(jsonPath("$.sessions[0].exercises[0].name").value("Dumbbell Bench Press"))
                .andExpect(jsonPath("$.sessions[0].exercises[0].sets").value(4))
                .andExpect(jsonPath("$.safetyNotes", hasItem(containsString("Minor lower back tightness"))))
                .andExpect(jsonPath("$.disclaimer", notNullValue()));
    }

    @Test
    @DisplayName("Generate Workout Plan: Deterministic Fallback when Gemini is unavailable or fails")
    void testGenerateWorkoutPlan_FallbackWhenGeminiFails() throws Exception {
        MockHttpSession session = registerUser("trainer2-" + UUID.randomUUID() + "@example.com", "Password123!", "Coach Maya");

        when(geminiClient.isConfigured()).thenReturn(false);

        WorkoutPlanGenerateRequest request = WorkoutPlanGenerateRequest.builder()
                .experienceLevel(ExperienceLevel.BEGINNER)
                .primaryGoal(WorkoutGoal.GENERAL_FITNESS)
                .trainingLocation(TrainingLocation.HOME)
                .daysPerWeek(3)
                .splitType(SplitType.FULL_BODY)
                .sessionDurationMins(45)
                .build();

        mockMvc.perform(post("/workout-plans/generate")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.primaryGoal").value("GENERAL_FITNESS"))
                .andExpect(jsonPath("$.daysPerWeek").value(3))
                .andExpect(jsonPath("$.sessions", hasSize(3)))
                .andExpect(jsonPath("$.sessions[0].exercises", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.progressionTips", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.disclaimer", notNullValue()));
    }

    @Test
    @DisplayName("Generate Workout Plan: Validation rejects invalid daysPerWeek and session duration")
    void testGenerateWorkoutPlan_ValidationRejectsInvalidDaysAndDuration() throws Exception {
        MockHttpSession session = registerUser("trainer3-" + UUID.randomUUID() + "@example.com", "Password123!", "Invalid Inputs User");

        // 8 days per week (exceeds 7)
        WorkoutPlanGenerateRequest request = WorkoutPlanGenerateRequest.builder()
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .primaryGoal(WorkoutGoal.STRENGTH)
                .trainingLocation(TrainingLocation.GYM)
                .daysPerWeek(8)
                .splitType(SplitType.UPPER_LOWER)
                .sessionDurationMins(60)
                .build();

        mockMvc.perform(post("/workout-plans/generate")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[0].message", containsString("Days per week must be between 1 and 7")));

        // 10 minutes session duration (under 15 min minimum)
        request.setDaysPerWeek(4);
        request.setSessionDurationMins(10);

        mockMvc.perform(post("/workout-plans/generate")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[0].message", containsString("Session duration must be at least 15 minutes")));
    }

    @Test
    @DisplayName("Save, List, and Retrieve Workout Plan for authenticated user")
    void testSaveAndRetrieveWorkoutPlan_Success() throws Exception {
        MockHttpSession session = registerUser("trainer4-" + UUID.randomUUID() + "@example.com", "Password123!", "Sam Athlete");

        WorkoutPlanDetailDto planDetail = WorkoutPlanDetailDto.builder()
                .title("Upper/Lower Strength Routine")
                .primaryGoal(WorkoutGoal.STRENGTH)
                .trainingLocation(TrainingLocation.GYM)
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .splitType(SplitType.UPPER_LOWER)
                .daysPerWeek(4)
                .sessionDurationMins(60)
                .creationDate("2026-10-21")
                .userAssumptions(Map.of("location", "GYM"))
                .sessions(List.of(
                        WorkoutSessionDto.builder()
                                .dayNumber(1)
                                .dayName("Day 1 - Upper Power")
                                .sessionTitle("Bench & Rows")
                                .isRestDay(false)
                                .muscleGroupsEmphasized(List.of("Chest", "Back"))
                                .exercises(List.of(
                                        WorkoutExerciseDto.builder()
                                                .name("Barbell Bench Press")
                                                .primaryTarget("Chest")
                                                .sets(5)
                                                .repsOrDuration("5 reps")
                                                .restSeconds(120)
                                                .equipment("Barbell, Bench")
                                                .instructions("Lower bar to sternum, drive up.")
                                                .build()
                                ))
                                .build()
                ))
                .build();

        SaveWorkoutPlanRequest saveReq = SaveWorkoutPlanRequest.builder()
                .title("My Autumn Strength Program")
                .primaryGoal(WorkoutGoal.STRENGTH)
                .trainingLocation(TrainingLocation.GYM)
                .splitType(SplitType.UPPER_LOWER)
                .daysPerWeek(4)
                .sessionDurationMins(60)
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .planDetail(planDetail)
                .build();

        // 1. Save plan
        MvcResult saveResult = mockMvc.perform(post("/workout-plans")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("My Autumn Strength Program"))
                .andExpect(jsonPath("$.primaryGoal").value("STRENGTH"))
                .andReturn();

        String planId = objectMapper.readTree(saveResult.getResponse().getContentAsString()).path("id").asText();

        // 2. List saved plans
        mockMvc.perform(get("/workout-plans")
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(planId))
                .andExpect(jsonPath("$[0].title").value("My Autumn Strength Program"));

        // 3. Get plan by ID
        mockMvc.perform(get("/workout-plans/" + planId)
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(planId))
                .andExpect(jsonPath("$.planDetail.sessions[0].exercises[0].name").value("Barbell Bench Press"));
    }

    @Test
    @DisplayName("User Isolation: User B cannot view or delete User A's workout plan")
    void testUserIsolation_CannotAccessAnotherUsersWorkoutPlan() throws Exception {
        MockHttpSession sessionA = registerUser("athleteA-" + UUID.randomUUID() + "@example.com", "Password123!", "User Alpha");
        MockHttpSession sessionB = registerUser("athleteB-" + UUID.randomUUID() + "@example.com", "Password123!", "User Beta");

        WorkoutPlanDetailDto planDetail = WorkoutPlanDetailDto.builder()
                .title("Alpha's Secret Plan")
                .primaryGoal(WorkoutGoal.MUSCLE_HYPERTROPHY)
                .trainingLocation(TrainingLocation.HOME)
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .splitType(SplitType.FULL_BODY)
                .daysPerWeek(3)
                .sessionDurationMins(45)
                .build();

        SaveWorkoutPlanRequest saveReq = SaveWorkoutPlanRequest.builder()
                .title("Alpha's Secret Routine")
                .primaryGoal(WorkoutGoal.MUSCLE_HYPERTROPHY)
                .trainingLocation(TrainingLocation.HOME)
                .splitType(SplitType.FULL_BODY)
                .daysPerWeek(3)
                .sessionDurationMins(45)
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .planDetail(planDetail)
                .build();

        MvcResult saveResult = mockMvc.perform(post("/workout-plans")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String planId = objectMapper.readTree(saveResult.getResponse().getContentAsString()).path("id").asText();

        // User B tries to view User A's plan -> 404 Not Found
        mockMvc.perform(get("/workout-plans/" + planId)
                        .session(sessionB))
                .andExpect(status().isNotFound());

        // User B lists their plans -> empty list
        mockMvc.perform(get("/workout-plans")
                        .session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Update and Delete Workout Plan: Successfully updates details and removes from database")
    void testUpdateAndDeleteWorkoutPlan_Success() throws Exception {
        MockHttpSession session = registerUser("athleteC-" + UUID.randomUUID() + "@example.com", "Password123!", "User Charlie");

        WorkoutPlanDetailDto detail = WorkoutPlanDetailDto.builder()
                .title("Initial Title")
                .primaryGoal(WorkoutGoal.ENDURANCE)
                .trainingLocation(TrainingLocation.HOME)
                .experienceLevel(ExperienceLevel.BEGINNER)
                .splitType(SplitType.FULL_BODY)
                .daysPerWeek(2)
                .sessionDurationMins(30)
                .build();

        SaveWorkoutPlanRequest saveReq = SaveWorkoutPlanRequest.builder()
                .title("Initial Routine")
                .primaryGoal(WorkoutGoal.ENDURANCE)
                .trainingLocation(TrainingLocation.HOME)
                .splitType(SplitType.FULL_BODY)
                .daysPerWeek(2)
                .sessionDurationMins(30)
                .experienceLevel(ExperienceLevel.BEGINNER)
                .planDetail(detail)
                .build();

        MvcResult saveResult = mockMvc.perform(post("/workout-plans")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String planId = objectMapper.readTree(saveResult.getResponse().getContentAsString()).path("id").asText();

        // Update plan
        detail.setTitle("Updated Title");
        saveReq.setTitle("Updated Routine Title");
        saveReq.setDaysPerWeek(3);

        mockMvc.perform(put("/workout-plans/" + planId)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Routine Title"))
                .andExpect(jsonPath("$.daysPerWeek").value(3));

        // Delete plan
        mockMvc.perform(delete("/workout-plans/" + planId)
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/workout-plans/" + planId)
                        .session(session))
                .andExpect(status().isNotFound());
    }
}
