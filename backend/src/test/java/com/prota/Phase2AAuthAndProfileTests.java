package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.dto.request.LoginRequest;
import com.prota.dto.request.RegisterRequest;
import com.prota.dto.request.UpdateProfileRequest;
import com.prota.dto.request.UpdateSettingsRequest;
import com.prota.entity.DailyLog;
import com.prota.entity.User;
import com.prota.entity.UserSetting;
import com.prota.entity.enums.ThemePreference;
import com.prota.entity.enums.WeightUnit;
import com.prota.repo.DailyLogRepository;
import com.prota.repo.UserRepository;
import com.prota.repo.UserSettingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class Phase2AAuthAndProfileTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSettingRepository userSettingRepository;

    @Autowired
    private DailyLogRepository dailyLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("User Registration: Success with BCrypt hashing and default settings initialization")
    void testRegistrationSuccess() throws Exception {
        String email = "reg-" + UUID.randomUUID() + "@example.com";
        String password = "SecurePassword123!";

        RegisterRequest registerReq = RegisterRequest.builder()
            .fullName("Jane Doe")
            .email(email)
            .password(password)
            .build();

        MvcResult result = mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.fullName").value("Jane Doe"))
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.status").value("ACTIVE"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andReturn();

        // 1. Password must be hashed in database (never plaintext)
        User user = userRepository.findByEmail(email).orElseThrow();
        assertThat(user.getPasswordHash()).startsWith("$2a$");
        assertThat(passwordEncoder.matches(password, user.getPasswordHash())).isTrue();

        // 2. Default user_settings must be initialized in the same transaction
        UserSetting settings = userSettingRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(settings.getProteinGoalG()).isEqualByComparingTo(new BigDecimal("140.00"));
        assertThat(settings.getCalorieGoalKcal()).isEqualByComparingTo(new BigDecimal("2000.00"));
        assertThat(settings.getWaterGoalMl()).isEqualTo(2500);
        assertThat(settings.getWeightUnit()).isEqualTo(WeightUnit.KG);
        assertThat(settings.getTimezone()).isEqualTo("UTC");
        assertThat(settings.getTheme()).isEqualTo(ThemePreference.SYSTEM);
    }

    @Test
    @DisplayName("User Registration: Duplicate email is rejected with 409 Conflict")
    void testDuplicateEmailRejected() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@example.com";

        RegisterRequest req1 = RegisterRequest.builder()
            .fullName("First User")
            .email(email)
            .password("Password123!")
            .build();

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
            .andExpect(status().isCreated());

        // Duplicate with uppercase/spaces normalization check
        RegisterRequest req2 = RegisterRequest.builder()
            .fullName("Second User")
            .email("  " + email.toUpperCase() + "  ")
            .password("AnotherPassword123!")
            .build();

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("USER_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Authentication: Login with valid credentials, invalid password, and non-existent email")
    void testLoginFlow() throws Exception {
        String email = "login-" + UUID.randomUUID() + "@example.com";
        String password = "CorrectPassword123!";

        registerUser(email, password, "Login Tester");

        // 1. Login with invalid password -> 401
        LoginRequest wrongPw = LoginRequest.builder()
            .email(email)
            .password("WrongPassword999!")
            .build();

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrongPw)))
            .andExpect(status().isUnauthorized());

        // 2. Login with non-existent email -> 401
        LoginRequest wrongEmail = LoginRequest.builder()
            .email("unknown-" + UUID.randomUUID() + "@example.com")
            .password("AnyPassword123!")
            .build();

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrongEmail)))
            .andExpect(status().isUnauthorized());

        // 3. Login with correct credentials -> 200 OK + session established
        LoginRequest validLogin = LoginRequest.builder()
            .email(email)
            .password(password)
            .build();

        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validLogin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();
        assertThat(session).isNotNull();

        // Verify session can access /auth/me
        mockMvc.perform(get("/auth/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    @DisplayName("Authentication: Logout invalidates server session")
    void testLogoutAndSessionInvalidation() throws Exception {
        String email = "logout-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "Logout User");

        // Authenticated access works
        mockMvc.perform(get("/auth/me").session(session))
            .andExpect(status().isOk());

        // Logout
        mockMvc.perform(post("/auth/logout").session(session))
            .andExpect(status().isNoContent());

        // Invalidated session cannot access protected endpoints
        mockMvc.perform(get("/auth/me").session(session))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CSRF Protection: Mutation requests without CSRF token are rejected with 403 Forbidden")
    void testCsrfProtectionEnforced() throws Exception {
        String email = "csrf-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "CSRF User");

        UpdateProfileRequest profileReq = UpdateProfileRequest.builder()
            .fullName("Tampered Name")
            .build();

        // 1. PATCH /users/me without CSRF -> 403 Forbidden
        mockMvc.perform(patch("/users/me").session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profileReq)))
            .andExpect(status().isForbidden());

        // 2. PATCH /users/me with CSRF -> 200 OK
        mockMvc.perform(patch("/users/me").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profileReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Tampered Name"));

        // 3. PATCH /settings without CSRF -> 403 Forbidden
        UpdateSettingsRequest settingsReq = UpdateSettingsRequest.builder()
            .proteinGoalG(new BigDecimal("160.00"))
            .weightUnit(WeightUnit.KG)
            .theme(ThemePreference.DARK)
            .build();

        mockMvc.perform(patch("/settings").session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(settingsReq)))
            .andExpect(status().isForbidden());

        // 4. PATCH /settings with CSRF -> 200 OK
        mockMvc.perform(patch("/settings").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(settingsReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.proteinGoalG").value(160.0));
    }

    @Test
    @DisplayName("CSRF Endpoint: GET /auth/csrf returns token metadata")
    void testGetCsrfToken() throws Exception {
        mockMvc.perform(get("/auth/csrf"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.headerName").isNotEmpty())
            .andExpect(jsonPath("$.parameterName").value("_csrf"));
    }

    @Test
    @DisplayName("Profile Management: GET and PATCH /users/me updates name while email remains read-only")
    void testProfileManagement() throws Exception {
        String email = "profile-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "Original Name");

        // 1. GET /users/me
        mockMvc.perform(get("/users/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Original Name"))
            .andExpect(jsonPath("$.email").value(email));

        // 2. PATCH /users/me
        UpdateProfileRequest updateReq = UpdateProfileRequest.builder()
            .fullName("Brand New Name")
            .build();

        mockMvc.perform(patch("/users/me").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("Brand New Name"))
            .andExpect(jsonPath("$.email").value(email));

        // Verify email in database did not change
        User user = userRepository.findByEmail(email).orElseThrow();
        assertThat(user.getFullName()).isEqualTo("Brand New Name");
        assertThat(user.getEmail()).isEqualTo(email);
    }

    @Test
    @DisplayName("Settings Management: Validation errors on negative protein and invalid timezone")
    void testSettingsValidation() throws Exception {
        String email = "settings-val-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "Val Tester");

        // 1. Negative protein goal -> 400 Bad Request
        UpdateSettingsRequest invalidProtein = UpdateSettingsRequest.builder()
            .proteinGoalG(new BigDecimal("-10.00"))
            .weightUnit(WeightUnit.KG)
            .theme(ThemePreference.SYSTEM)
            .build();

        mockMvc.perform(patch("/settings").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidProtein)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        // 2. Invalid timezone identifier -> 400 Bad Request
        UpdateSettingsRequest invalidTz = UpdateSettingsRequest.builder()
            .proteinGoalG(new BigDecimal("150.00"))
            .timezone("Invalid/Fictional_Zone")
            .weightUnit(WeightUnit.KG)
            .theme(ThemePreference.SYSTEM)
            .build();

        mockMvc.perform(patch("/settings").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidTz)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_ARGUMENT"));

        // 3. Valid update succeeds
        UpdateSettingsRequest validReq = UpdateSettingsRequest.builder()
            .proteinGoalG(new BigDecimal("175.50"))
            .calorieGoalKcal(new BigDecimal("2250.00"))
            .waterGoalMl(3200)
            .weightUnit(WeightUnit.LB)
            .timezone("America/New_York")
            .theme(ThemePreference.DARK)
            .build();

        mockMvc.perform(patch("/settings").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.proteinGoalG").value(175.50))
            .andExpect(jsonPath("$.calorieGoalKcal").value(2250.00))
            .andExpect(jsonPath("$.waterGoalMl").value(3200))
            .andExpect(jsonPath("$.weightUnit").value("LB"))
            .andExpect(jsonPath("$.timezone").value("America/New_York"))
            .andExpect(jsonPath("$.theme").value("DARK"));
    }

    @Test
    @DisplayName("User Isolation: User A and User B settings and profiles are completely isolated")
    void testUserIsolation() throws Exception {
        String emailA = "user-a-" + UUID.randomUUID() + "@example.com";
        String emailB = "user-b-" + UUID.randomUUID() + "@example.com";

        MockHttpSession sessionA = registerUser(emailA, "Password123!", "User Alpha");
        MockHttpSession sessionB = registerUser(emailB, "Password123!", "User Beta");

        // User A sets 200g protein goal
        UpdateSettingsRequest settingsA = UpdateSettingsRequest.builder()
            .proteinGoalG(new BigDecimal("200.00"))
            .weightUnit(WeightUnit.KG)
            .theme(ThemePreference.LIGHT)
            .build();

        mockMvc.perform(patch("/settings").with(csrf()).session(sessionA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(settingsA)))
            .andExpect(status().isOk());

        // User B retrieves their settings -> still default 140g, untouched by User A
        mockMvc.perform(get("/settings").session(sessionB))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.proteinGoalG").value(140.0))
            .andExpect(jsonPath("$.theme").value("SYSTEM"));

        // User B retrieves their profile -> returns User Beta, untouched by User A
        mockMvc.perform(get("/users/me").session(sessionB))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullName").value("User Beta"))
            .andExpect(jsonPath("$.email").value(emailB));
    }

    @Test
    @DisplayName("Historical Data Integrity: Changing current goal must never rewrite past daily_logs snapshots")
    void testGoalChangePreservesHistoricalSnapshots() throws Exception {
        String email = "history-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "History Preserver");

        User user = userRepository.findByEmail(email).orElseThrow();

        // Directly persist a past daily log snapshot with 140.00g goal
        LocalDate pastDate = LocalDate.of(2026, 10, 1);
        DailyLog pastLog = DailyLog.builder()
            .user(user)
            .logDate(pastDate)
            .timezoneAtCreation("UTC")
            .proteinGoalG(new BigDecimal("140.00"))
            .calorieGoalKcal(new BigDecimal("2000.00"))
            .waterGoalMl(2500)
            .build();

        DailyLog savedPastLog = dailyLogRepository.save(pastLog);

        // Update current settings to 210.00g protein goal
        UpdateSettingsRequest updatedSettings = UpdateSettingsRequest.builder()
            .proteinGoalG(new BigDecimal("210.00"))
            .weightUnit(WeightUnit.KG)
            .theme(ThemePreference.DARK)
            .build();

        mockMvc.perform(patch("/settings").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedSettings)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.proteinGoalG").value(210.0));

        // Re-read past daily log snapshot from database
        DailyLog reReadLog = dailyLogRepository.findById(savedPastLog.getId()).orElseThrow();
        // It MUST still equal 140.00g (historical snapshot preserved)
        assertThat(reReadLog.getProteinGoalG()).isEqualByComparingTo(new BigDecimal("140.00"));
        assertThat(reReadLog.getCalorieGoalKcal()).isEqualByComparingTo(new BigDecimal("2000.00"));
    }

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
}
