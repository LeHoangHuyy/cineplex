package com.cineplex.common.utils;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern EDGESDHASHES = Pattern.compile("(^-|-$)");
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private SlugUtils() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        
        // Remove Vietnamese accents (đ/Đ and diacritics)
        String normalized = input.replace("đ", "d").replace("Đ", "D");
        normalized = Normalizer.normalize(normalized, Normalizer.Form.NFD);
        normalized = DIACRITICS.matcher(normalized).replaceAll("");

        String nowhitespace = WHITESPACE.matcher(normalized).replaceAll("-");
        String normalizedString = NONLATIN.matcher(nowhitespace).replaceAll("");
        String slug = EDGESDHASHES.matcher(normalizedString).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}

