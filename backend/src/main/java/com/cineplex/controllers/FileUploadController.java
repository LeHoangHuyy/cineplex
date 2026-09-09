package com.cineplex.controllers;

import com.cineplex.services.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final MinioService minioService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        String url = minioService.uploadImage(file);
        return ResponseEntity.ok(Map.of(
                "url", url,
                "originalName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "image",
                "size", file.getSize(),
                "contentType", file.getContentType() != null ? file.getContentType() : "image/jpeg"
        ));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteFile(@RequestParam("url") String url) {
        minioService.deleteImage(url);
        return ResponseEntity.ok(Map.of("message", "Đã xóa ảnh thành công"));
    }
}
