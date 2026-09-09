package com.cineplex.services;

import io.minio.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${app.minio.bucket-name:cineplex}")
    private String bucketName;

    @Value("${app.minio.public-url:http://localhost:9000/cineplex}")
    private String publicUrl;

    @PostConstruct
    public void init() {
        try {
            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );

            if (!bucketExists) {
                log.info("MinIO bucket '{}' chưa tồn tại. Đang tiến hành tạo bucket...", bucketName);
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucketName).build()
                );

                // Set public read policy for images
                String publicReadPolicy = """
                    {
                      "Version": "2012-10-17",
                      "Statement": [
                        {
                          "Effect": "Allow",
                          "Principal": {"AWS": ["*"]},
                          "Action": ["s3:GetObject"],
                          "Resource": ["arn:aws:s3:::%s/*"]
                        }
                      ]
                    }
                    """.formatted(bucketName);

                minioClient.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(bucketName)
                                .config(publicReadPolicy)
                                .build()
                );
                log.info("Đã khởi tạo thành công bucket MinIO '{}' với quyền Public Read", bucketName);
            } else {
                log.info("MinIO bucket '{}' đã sẵn sàng", bucketName);
            }
        } catch (Exception e) {
            log.warn("Không thể tự động khởi tạo bucket MinIO trong lúc khởi động: {}", e.getMessage());
        }
    }

    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh tải lên không được để trống");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        // Validate image format
        if (!extension.matches("\\.(jpg|jpeg|png|webp|gif|svg|jfif|bmp|avif)$")) {
            throw new IllegalArgumentException("Định dạng file không hợp lệ! Vui lòng tải lên ảnh định dạng jpg, jpeg, png, webp, gif, svg, jfif hoặc avif.");
        }

        String objectName = UUID.randomUUID() + extension;
        String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(contentType)
                            .build()
            );

            log.info("Đã lưu ảnh thành công vào MinIO: {}", objectName);

            String cleanPublicUrl = publicUrl.endsWith("/") 
                    ? publicUrl.substring(0, publicUrl.length() - 1) 
                    : publicUrl;
            return cleanPublicUrl + "/" + objectName;
        } catch (Exception e) {
            log.error("Lỗi khi lưu trữ ảnh lên MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi máy chủ lưu trữ MinIO: " + e.getMessage());
        }
    }

    public void deleteImage(String fileUrlOrName) {
        if (fileUrlOrName == null || fileUrlOrName.trim().isEmpty()) return;

        String objectName = fileUrlOrName;
        if (fileUrlOrName.contains("/")) {
            objectName = fileUrlOrName.substring(fileUrlOrName.lastIndexOf("/") + 1);
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("Đã xóa ảnh khỏi MinIO: {}", objectName);
        } catch (Exception e) {
            log.warn("Không thể xóa ảnh từ MinIO: {}", e.getMessage());
        }
    }
}
