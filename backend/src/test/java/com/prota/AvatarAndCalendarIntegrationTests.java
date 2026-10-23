package com.prota;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prota.dto.request.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AvatarAndCalendarIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    @Test
    @DisplayName("Should successfully upload PNG avatar, serve it, and then delete it")
    void testUploadAndRemoveAvatar() throws Exception {
        String email = "avatar-upload-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "Avatar User");

        // Genuine PNG header bytes: 89 50 4E 47 0D 0A 1A 0A followed by dummy payload
        byte[] pngBytes = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
        };

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "avatar.png",
            "image/png",
            pngBytes
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/users/me/avatar")
                .file(file)
                .session(session)
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.profilePictureUrl").isString())
            .andReturn();

        String responseBody = uploadResult.getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertTrue(responseBody.contains("/api/v1/users/avatar/"));

        // Now test delete avatar
        mockMvc.perform(delete("/users/me/avatar")
                .session(session)
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.profilePictureUrl").isEmpty());
    }

    @Test
    @DisplayName("Should reject upload when file is not a valid image format")
    void testUploadInvalidFile() throws Exception {
        String email = "avatar-invalid-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "Invalid Image User");

        byte[] fakeBytes = "This is not an image at all!".getBytes();

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "fake.jpg",
            "image/jpeg",
            fakeBytes
        );

        mockMvc.perform(multipart("/users/me/avatar")
                .file(file)
                .session(session)
                .with(csrf()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_ARGUMENT"));
    }

    @Test
    @DisplayName("Should query daily logs range successfully")
    void testGetDailyLogsRange() throws Exception {
        String email = "calendar-range-" + UUID.randomUUID() + "@example.com";
        MockHttpSession session = registerUser(email, "Password123!", "Calendar Range User");

        mockMvc.perform(get("/logs/daily/range")
                .param("from", "2026-10-01")
                .param("to", "2026-10-31")
                .session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
