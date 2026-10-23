package com.prota;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAndActuatorTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Verify Actuator health endpoint is publicly accessible and returns UP")
    void testActuatorHealthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("Verify sensitive Actuator endpoints require authentication")
    void testSensitiveActuatorEndpointsRequireAuth() throws Exception {
        mockMvc.perform(get("/actuator/beans"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Verify API endpoints require authentication")
    void testApiEndpointsRequireAuth() throws Exception {
        mockMvc.perform(get("/users/me"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/settings"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Verify CORS preflight headers are returned for configured frontend origin")
    void testCorsPreflight() throws Exception {
        mockMvc.perform(options("/actuator/health")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }
}
