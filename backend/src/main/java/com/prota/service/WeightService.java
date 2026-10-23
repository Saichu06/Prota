package com.prota.service;

import com.prota.dto.request.CreateWeightEntryRequest;
import com.prota.dto.response.WeightEntryResponse;
import com.prota.entity.User;
import com.prota.entity.WeightEntry;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.UserRepository;
import com.prota.repo.WeightEntryRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class WeightService {

    private final WeightEntryRepository weightEntryRepository;
    private final UserRepository userRepository;

    public WeightService(WeightEntryRepository weightEntryRepository, UserRepository userRepository) {
        this.weightEntryRepository = weightEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WeightEntryResponse createWeightEntry(CreateWeightEntryRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WeightEntry entry = WeightEntry.builder()
                .user(user)
                .entryDate(request.getEntryDate())
                .weightKg(request.getWeightKg())
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .recordedAt(request.getRecordedAt() != null ? request.getRecordedAt() : Instant.now())
                .build();

        WeightEntry saved = weightEntryRepository.save(entry);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WeightEntryResponse> getDailyWeightEntries(LocalDate date) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return weightEntryRepository.findByUserIdAndEntryDateOrderByRecordedAtDesc(userId, date)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void deleteWeightEntry(UUID id) {
        UUID userId = SecurityUtils.getCurrentUserId();
        WeightEntry entry = weightEntryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Weight entry not found with id: " + id));

        weightEntryRepository.delete(entry);
    }

    private WeightEntryResponse mapToResponse(WeightEntry entry) {
        return WeightEntryResponse.builder()
                .id(entry.getId())
                .weightKg(entry.getWeightKg())
                .entryDate(entry.getEntryDate())
                .notes(entry.getNotes())
                .recordedAt(entry.getRecordedAt())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
