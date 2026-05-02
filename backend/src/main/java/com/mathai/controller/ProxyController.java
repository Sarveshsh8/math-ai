package com.mathai.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;

/**
 * Proxies all /api/** requests to the Python AI service.
 * JWT is validated by JwtFilter before this controller is reached.
 * SSE endpoints stream bytes directly through; JSON endpoints buffer and return.
 */
@RestController
public class ProxyController {

    @Value("${mathai.ai.base-url}")
    private String aiBaseUrl;

    @Value("${mathai.ai.internal-token:}")
    private String internalToken;

    @Value("${mathai.proxy.max-body-bytes:8192}")
    private int maxBodyBytes;

    @Value("${mathai.proxy.read-timeout-ms:180000}")
    private int readTimeoutMs;

    /** SSE streaming endpoint — passes bytes through without buffering */
    @PostMapping(value = "/api/solve", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public StreamingResponseBody proxySolveStream(
        HttpServletRequest request,
        HttpServletResponse response,
        @RequestBody byte[] body,
        Authentication auth
    ) {
        return outputStream -> forward(request, response, body, outputStream, "/api/solve");
    }

    @PostMapping(value = "/api/practice/grade", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public StreamingResponseBody proxyGradeStream(
        HttpServletRequest request,
        HttpServletResponse response,
        @RequestBody byte[] body,
        Authentication auth
    ) {
        return outputStream -> forward(request, response, body, outputStream, "/api/practice/grade");
    }

    /** Standard JSON proxy for all other /api/** routes */
    @RequestMapping("/api/**")
    public StreamingResponseBody proxyGeneric(
        HttpServletRequest request,
        HttpServletResponse response,
        @RequestBody(required = false) byte[] body,
        Authentication auth
    ) {
        String path = request.getRequestURI();
        return outputStream -> forward(request, response, body, outputStream, path);
    }

    private void forward(HttpServletRequest request, HttpServletResponse response, byte[] body, OutputStream out, String path) throws IOException {
        if (body != null && body.length > maxBodyBytes) {
            response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            out.write("{\"detail\":\"Request body too large\"}".getBytes(StandardCharsets.UTF_8));
            return;
        }

        URI uri = URI.create(aiBaseUrl + path +
            (request.getQueryString() != null ? "?" + request.getQueryString() : ""));

        HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
        conn.setRequestMethod(request.getMethod());
        conn.setDoInput(true);
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(readTimeoutMs);
        if (internalToken != null && !internalToken.isBlank()) {
            conn.setRequestProperty("X-Internal-Token", internalToken);
        }

        // forward content-type
        String ct = request.getContentType();
        if (ct != null) conn.setRequestProperty("Content-Type", ct);

        // forward body if present
        if (body != null && body.length > 0) {
            conn.setDoOutput(true);
            conn.getOutputStream().write(body);
        }

        int status = conn.getResponseCode();
        response.setStatus(status);
        InputStream is = status >= 400 ? conn.getErrorStream() : conn.getInputStream();

        if (is != null) {
            byte[] buf = new byte[4096];
            int n;
            while ((n = is.read(buf)) != -1) {
                out.write(buf, 0, n);
                out.flush();
            }
        }
    }
}
