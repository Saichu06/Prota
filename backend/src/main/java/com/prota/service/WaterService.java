package com.prota.service;

import com.prota.dto.request.CreateWaterEntryRequest;
import com.prota.dto.response.WaterEntryResponse;
import com.prota.entity.User;
import com.prota.entity.WaterEntry;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.UserRepository;
import com.prota.repo.WaterEntryRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class WaterService {

    private final WaterEntryRepository waterEntryRepository;
    private final UserRepository userRepository;

    public WaterService(WaterEntryRepository waterEntryRepository, UserRepository userRepository) {
        this.waterEntryRepository = waterEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WaterEntryResponse createWaterEntry(CreateWaterEntryRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WaterEntry entry = WaterEntry.builder()
                .user(user)
                .entryDate(request.getEntryDate())
                .amountMl(request.getAmountMl())
                .consumedAt(request.getConsumedAt() != null ? request.getConsumedAt() : Instant.now())
                .build();

        WaterEntry saved = waterEntryRepository.save(entry);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WaterEntryResponse> getDailyWaterEntries(LocalDate date) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return waterEntryRepository.findByUserIdAndEntryDateOrderByConsumedAtDesc(userId, date)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void deleteWaterEntry(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        WaterEntry entry = waterEntryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Water entry not found with id: " + id));

        waterEntryRepository.delete(entry);
    }

    private WaterEntryResponse mapToResponse(WaterEntry entry) {
        return WaterEntryResponse.builder()
                .id(entry.getId())
                .entryDate(entry.getEntryDate())
                .amountMl(entry.getAmountMl())
                .consumedAt(entry.getConsumedAt())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
