package com.prota.service;

import com.prota.dto.request.UpdateProfileRequest;
import com.prota.dto.response.UserResponse;
import com.prota.entity.User;
import com.prota.exception.ResourceNotFoundException;
import com.prota.repo.UserRepository;
import com.prota.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return AuthService.mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setFullName(request.getFullName().trim());
        User updated = userRepository.save(user);

        return AuthService.mapToUserResponse(updated);
    }

    @Transactional
    public UserResponse uploadAvatar(org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No image file provided");
        }

        // Limit to 2 MB (2,097,152 bytes)
        long maxSizeBytes = 2 * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("Image file size exceeds the maximum limit of 2MB");
        }

        // Detect and validate file content magic bytes
        String extension = detectImageExtension(file);

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        try {
            java.nio.file.Path avatarDir = java.nio.file.Paths.get("uploads", "avatars").toAbsolutePath().normalize();
            java.nio.file.Files.createDirectories(avatarDir);

            // Clean up previous avatar if it was locally uploaded
            if (user.getProfilePictureUrl() != null && user.getProfilePictureUrl().startsWith("/api/v1/users/avatar/")) {
                String oldFileName = user.getProfilePictureUrl().substring("/api/v1/users/avatar/".length());
                if (!oldFileName.contains("..") && !oldFileName.contains("/") && !oldFileName.contains("\\")) {
                    java.nio.file.Path oldPath = avatarDir.resolve(oldFileName).normalize();
                    try {
                        java.nio.file.Files.deleteIfExists(oldPath);
                    } catch (Exception ignored) {
                        // ignore cleanup failure
                    }
                }
            }

            String newFileName = currentUserId + "_" + System.currentTimeMillis() + "." + extension;
            java.nio.file.Path targetPath = avatarDir.resolve(newFileName).normalize();

            // Prevent path traversal
            if (!targetPath.startsWith(avatarDir)) {
                throw new IllegalArgumentException("Invalid file destination path");
            }

            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            user.setProfilePictureUrl("/api/v1/users/avatar/" + newFileName);
            User updated = userRepository.save(user);
            return AuthService.mapToUserResponse(updated);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store image file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public UserResponse removeAvatar() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getProfilePictureUrl() != null && user.getProfilePictureUrl().startsWith("/api/v1/users/avatar/")) {
            String oldFileName = user.getProfilePictureUrl().substring("/api/v1/users/avatar/".length());
            if (!oldFileName.contains("..") && !oldFileName.contains("/") && !oldFileName.contains("\\")) {
                java.nio.file.Path avatarDir = java.nio.file.Paths.get("uploads", "avatars").toAbsolutePath().normalize();
                java.nio.file.Path oldPath = avatarDir.resolve(oldFileName).normalize();
                try {
                    java.nio.file.Files.deleteIfExists(oldPath);
                } catch (Exception ignored) {
                    // ignore cleanup failure
                }
            }
        }

        user.setProfilePictureUrl(null);
        User updated = userRepository.save(user);
        return AuthService.mapToUserResponse(updated);
    }

    @Transactional(readOnly = true)
    public org.springframework.core.io.Resource getAvatarResource(String fileName) {
        if (fileName == null || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new ResourceNotFoundException("Avatar not found");
        }

        java.nio.file.Path avatarDir = java.nio.file.Paths.get("uploads", "avatars").toAbsolutePath().normalize();
        java.nio.file.Path filePath = avatarDir.resolve(fileName).normalize();

        if (!filePath.startsWith(avatarDir) || !java.nio.file.Files.exists(filePath) || !java.nio.file.Files.isRegularFile(filePath)) {
            throw new ResourceNotFoundException("Avatar not found");
        }

        try {
            return new org.springframework.core.io.UrlResource(filePath.toUri());
        } catch (java.net.MalformedURLException e) {
            throw new ResourceNotFoundException("Avatar resource cannot be resolved");
        }
    }

    private String detectImageExtension(org.springframework.web.multipart.MultipartFile file) {
        byte[] header = new byte[16];
        try (java.io.InputStream is = file.getInputStream()) {
            int read = is.read(header);
            if (read < 12) {
                throw new IllegalArgumentException("Invalid file content: file is too small to be a valid image");
            }
        } catch (java.io.IOException e) {
            throw new IllegalArgumentException("Failed to read image content");
        }

        // JPEG: FF D8 FF
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "jpg";
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A) {
            return "png";
        }

        // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
        if (header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return "webp";
        }

        throw new IllegalArgumentException("Invalid image content. Only genuine JPEG, PNG, and WebP files are accepted.");
    }
}
